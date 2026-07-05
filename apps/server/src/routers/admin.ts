import { z } from "zod";
import { createTRPCRouter, roleProcedure } from "../trpc";

export const adminRouter = createTRPCRouter({
  stats: roleProcedure(["ADMIN"]).query(async ({ ctx }) => {
    const [users, trips, drivers, revenue] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.trip.count(),
      ctx.prisma.driver.count(),
      ctx.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCEEDED" } })
    ]);
    return {
      users,
      trips,
      drivers,
      revenue: revenue._sum.amount ?? 0
    };
  }),

  users: roleProcedure(["ADMIN"]).query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  }),

  trips: roleProcedure(["ADMIN"]).query(async ({ ctx }) => {
    return ctx.prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { rider: true, driver: true, payment: true }
    });
  }),

  drivers: roleProcedure(["ADMIN"]).query(async ({ ctx }) => {
    return ctx.prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, vehicle: true }
    });
  }),

  setDriverStatus: roleProcedure(["ADMIN"]).input(z.object({
    driverId: z.string(),
    status: z.enum(["OFFLINE", "ONLINE", "IN_TRIP"])
  })).mutation(async ({ ctx, input }) => {
    return ctx.prisma.driver.update({
      where: { id: input.driverId },
      data: { status: input.status }
    });
  })
});
