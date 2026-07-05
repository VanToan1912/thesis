import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  VNPAY_TMN_CODE: z.string().optional(),
  VNPAY_HASH_SECRET: z.string().optional(),
  VNPAY_URL: z.string().default("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"),
  VNPAY_RETURN_URL: z.string().default("ridewithme://payment-return"),
  VNPAY_IPN_URL: z.string().default("http://localhost:4000/vnpay/ipn"),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  ADMIN_SECRET: z.string().optional(),
  APP_PUBLIC_API_URL: z.string().default("http://localhost:4000")
});

export const env = envSchema.parse(process.env);
