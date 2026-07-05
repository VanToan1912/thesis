import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import { createContext } from "./trpc";
import { env } from "./env";
import { verifyVnpayReturn } from "./vnpay";
import { prisma } from "@ridewithme/db";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ridewithme-server" });
});

app.get("/vnpay/return", async (req, res) => {
  const params = req.query as Record<string, string>;
  const ok = verifyVnpayReturn(params);
  if (!ok) {
    return res.status(400).send("Invalid VNPay checksum");
  }

  const responseCode = params.vnp_ResponseCode;
  const txnRef = params.vnp_TxnRef;
  if (responseCode === "00" && txnRef) {
    await prisma.payment.update({
      where: { id: txnRef },
      data: {
        status: "SUCCEEDED",
        gatewayTransactionId: params.vnp_TransactionNo ?? null
      }
    }).catch(() => null);
  }

  const redirect = new URL(env.VNPAY_RETURN_URL);
  redirect.searchParams.set("status", responseCode === "00" ? "success" : "failed");
  if (txnRef) redirect.searchParams.set("txnRef", txnRef);
  return res.redirect(302, redirect.toString());
});

app.post("/vnpay/ipn", async (req, res) => {
  const params = req.body as Record<string, string>;
  const ok = verifyVnpayReturn(params);
  if (!ok) {
    return res.json({ RspCode: "97", Message: "Invalid signature" });
  }

  const responseCode = params.vnp_ResponseCode;
  const txnRef = params.vnp_TxnRef;
  if (responseCode === "00" && txnRef) {
    await prisma.payment.update({
      where: { id: txnRef },
      data: { status: "SUCCEEDED", gatewayTransactionId: params.vnp_TransactionNo ?? null }
    }).catch(() => null);
  }

  return res.json({ RspCode: "00", Message: "Confirm Success" });
});

app.use("/trpc", createExpressMiddleware({
  router: appRouter,
  createContext
}));

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`RideWithMe server running on http://localhost:${port}`);
});
