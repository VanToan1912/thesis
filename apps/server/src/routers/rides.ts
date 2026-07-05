import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { env } from "../env";
import { haversineKm, estimateMinutes } from "../utils";
import { createVnpayPaymentUrl, verifyVnpayReturn } from "../vnpay";
import { NearestDriverMatchingStrategy, VehicleBasedPricingStrategy, Driver, Vehicle, Location } from "@ridewithme/domain";

const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string()
});

const createCheckoutSchema = z.object({
  pickup: locationSchema,
  dropoff: locationSchema,
  rideType: z.enum(["AUTO", "SEDAN", "SUV"]),
  note: z.string().optional()
});

function toTripMetadata(input: z.infer<typeof createCheckoutSchema>, distanceKm: number, durationMinutes: number, fare: number) {
  return {
    pickup: input.pickup,
    dropoff: input.dropoff,
    rideType: input.rideType,
    note: input.note ?? "",
    distanceKm,
    durationMinutes,
    fare
  };
}

export const ridesRouter = createTRPCRouter({
  estimate: protectedProcedure.input(createCheckoutSchema).query(async ({ ctx, input }) => {
    const distanceKm = haversineKm(
      { lat: input.pickup.latitude, lng: input.pickup.longitude },
      { lat: input.dropoff.latitude, lng: input.dropoff.longitude }
    );
    const durationMinutes = estimateMinutes(distanceKm, input.rideType);
    const pricing = new VehicleBasedPricingStrategy();
    const pickupLocation = new Location(input.pickup.longitude, input.pickup.latitude, input.pickup.address);
    const dropoffLocation = new Location(input.dropoff.longitude, input.dropoff.latitude, input.dropoff.address);
    const fare = Number(pricing.calculateFare(pickupLocation, dropoffLocation, input.rideType).toFixed(0));

    const driverMatcher = new NearestDriverMatchingStrategy();
    const drivers = await ctx.prisma.driver.findMany({
      where: { status: "ONLINE", vehicle: { type: input.rideType } },
      include: { user: true, vehicle: true }
    });

    const matchedDrivers = driverMatcher.findDrivers(
      drivers.map((driver) => new Driver(
        driver.id,
        driver.user.name,
        new Vehicle(driver.vehicle?.model ?? "Unknown", driver.vehicle?.type ?? input.rideType, driver.vehicle?.licenseNumber ?? ""),
        new Location(driver.currentLng, driver.currentLat),
        driver.status
      )),
      pickupLocation,
      input.rideType
    );

    return {
      distanceKm,
      durationMinutes,
      fare,
      nearbyDrivers: matchedDrivers.slice(0, 4).map((driver: any) => ({
        id: driver.id,
        name: driver.name,
        vehicleType: driver.vehicle.type,
        latitude: driver.currentLocation.latitude,
        longitude: driver.currentLocation.longitude
      }))
    };
  }),

  createCheckout: protectedProcedure.input(createCheckoutSchema).mutation(async ({ ctx, input }) => {
    const distanceKm = haversineKm(
      { lat: input.pickup.latitude, lng: input.pickup.longitude },
      { lat: input.dropoff.latitude, lng: input.dropoff.longitude }
    );
    const durationMinutes = estimateMinutes(distanceKm, input.rideType);
    const fare = Number(new VehicleBasedPricingStrategy().calculateFare(
      new Location(input.pickup.longitude, input.pickup.latitude, input.pickup.address),
      new Location(input.dropoff.longitude, input.dropoff.latitude, input.dropoff.address),
      input.rideType
    ).toFixed(0));

    const payment = await ctx.prisma.payment.create({
      data: {
        userId: ctx.userId!,
        amount: fare,
        currency: "VND",
        status: "REQUIRES_PAYMENT",
        metadata: toTripMetadata(input, distanceKm, durationMinutes, fare)
      }
    });

    const paymentUrl = createVnpayPaymentUrl({
      orderId: payment.id,
      amountVnd: fare,
      orderInfo: `RideWithMe payment for ride ${payment.id}`,
      orderType: "other",
      locale: "vn",
      ipAddr: String(ctx.req.headers["x-forwarded-for"] ?? ctx.req.socket.remoteAddress ?? "127.0.0.1").split(",")[0]?.trim() || "127.0.0.1"
    });

    return { paymentId: payment.id, paymentUrl, amount: fare, distanceKm, durationMinutes };
  }),

  confirmPayment: protectedProcedure.input(z.object({
    query: z.record(z.string())
  })).mutation(async ({ ctx, input }) => {
    const isValid = verifyVnpayReturn(input.query);
    const txnRef = input.query.vnp_TxnRef;
    if (!isValid || !txnRef) {
      throw new Error("VNPay checksum không hợp lệ");
    }

    if (env.VNPAY_TMN_CODE && input.query.vnp_TmnCode && input.query.vnp_TmnCode !== env.VNPAY_TMN_CODE) {
      throw new Error("VNPay terminal code không khớp");
    }

    const responseCode = input.query.vnp_ResponseCode;
    const payment = await ctx.prisma.payment.findUnique({ where: { id: txnRef } });
    if (!payment) {
      throw new Error("Không tìm thấy giao dịch");
    }

    if (payment.tripId) {
      return { success: true, tripId: payment.tripId };
    }

    const paidAmount = Number(input.query.vnp_Amount ?? 0) / 100;
    if (Math.round(paidAmount) !== Math.round(payment.amount)) {
      throw new Error("Số tiền thanh toán không khớp");
    }

    if (responseCode !== "00") {
      await ctx.prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" }
      });
      return { success: false, reason: responseCode };
    }

    const metadata = payment.metadata as any;
    const matchedDriver = await ctx.prisma.driver.findFirst({
      where: { status: "ONLINE", vehicle: { type: metadata.rideType } },
      include: { user: true, vehicle: true },
      orderBy: { rating: "desc" }
    });

    const trip = await ctx.prisma.trip.create({
      data: {
        riderId: ctx.userId!,
        driverId: matchedDriver?.userId,
        rideType: metadata.rideType,
        status: matchedDriver ? "ASSIGNED" : "REQUESTED",
        paymentStatus: "SUCCEEDED",
        pickupAddress: metadata.pickup.address,
        pickupLat: metadata.pickup.latitude,
        pickupLng: metadata.pickup.longitude,
        dropoffAddress: metadata.dropoff.address,
        dropoffLat: metadata.dropoff.latitude,
        dropoffLng: metadata.dropoff.longitude,
        distanceKm: metadata.distanceKm,
        durationMinutes: metadata.durationMinutes,
        fare: metadata.fare,
        routePolyline: `${metadata.pickup.latitude},${metadata.pickup.longitude};${metadata.dropoff.latitude},${metadata.dropoff.longitude}`
      }
    });

    await ctx.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        tripId: trip.id,
        gatewayTransactionId: input.query.vnp_TransactionNo ?? null
      }
    });

    if (matchedDriver) {
      await ctx.prisma.driver.update({
        where: { id: matchedDriver.id },
        data: { status: "IN_TRIP" }
      });
    }

    return { success: true, tripId: trip.id };
  }),

  recent: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.trip.findMany({
      where: { riderId: ctx.userId! },
      orderBy: { createdAt: "desc" },
      take: 5
    });
  }),

  history: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.trip.findMany({
      where: { riderId: ctx.userId! },
      orderBy: { createdAt: "desc" }
    });
  })
});
