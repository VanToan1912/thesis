import { env } from "./env";
import { formatVietnameseDate, hmacSha512, sortObject } from "./utils";

export type VnpayPaymentInput = {
  orderId: string;
  amountVnd: number;
  orderInfo: string;
  orderType?: string;
  ipAddr?: string;
  locale?: "vn" | "en";
  bankCode?: string;
  expireMinutes?: number;
};

function buildSignedQuery(params: Record<string, string | number | undefined>, secret: string) {
  const sortedParams = sortObject(params);
  const query = Object.entries(sortedParams)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  const hash = hmacSha512(secret, query);
  return `${query}&vnp_SecureHash=${hash}`;
}

export function createVnpayPaymentUrl(input: VnpayPaymentInput) {
  if (!env.VNPAY_TMN_CODE || !env.VNPAY_HASH_SECRET) {
    throw new Error("Thiếu cấu hình VNPay. Cần VNPAY_TMN_CODE và VNPAY_HASH_SECRET.");
  }

  const now = new Date();
  const expire = new Date(now.getTime() + (input.expireMinutes ?? 15) * 60_000);
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: env.VNPAY_TMN_CODE,
    vnp_Amount: Math.round(input.amountVnd * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: input.orderId,
    vnp_OrderInfo: input.orderInfo,
    vnp_OrderType: input.orderType ?? "other",
    vnp_Locale: input.locale ?? "vn",
    vnp_ReturnUrl: env.VNPAY_RETURN_URL,
    vnp_IpAddr: input.ipAddr ?? "127.0.0.1",
    vnp_CreateDate: formatVietnameseDate(now),
    vnp_ExpireDate: formatVietnameseDate(expire)
  };

  const query = buildSignedQuery(params, env.VNPAY_HASH_SECRET);
  return `${env.VNPAY_URL}?${query}`;
}

export function verifyVnpayReturn(params: Record<string, string | undefined>) {
  if (!env.VNPAY_HASH_SECRET) {
    throw new Error("Thiếu VNPAY_HASH_SECRET.");
  }

  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = params;
  const normalized = sortObject(rest as Record<string, string>);
  const query = Object.entries(normalized)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  const hash = hmacSha512(env.VNPAY_HASH_SECRET, query);
  return !vnp_SecureHash || hash.toLowerCase() === vnp_SecureHash.toLowerCase();
}
