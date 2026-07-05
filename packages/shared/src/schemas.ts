import { z } from "zod";

export const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional()
});

export const authEmailSchema = z.string().email();
export const authPasswordSchema = z.string().min(8);

export const rideTypeSchema = z.enum(["AUTO", "SEDAN", "SUV"]);
export const tripStatusSchema = z.enum(["REQUESTED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const driverStatusSchema = z.enum(["OFFLINE", "ONLINE", "IN_TRIP"]);
export const paymentStatusSchema = z.enum(["REQUIRES_PAYMENT", "PROCESSING", "SUCCEEDED", "FAILED"]);
export const userRoleSchema = z.enum(["RIDER", "DRIVER", "ADMIN"]);

export const onboardSchema = z.object({
  acceptedTerms: z.boolean(),
  marketingOptIn: z.boolean().default(false)
});
