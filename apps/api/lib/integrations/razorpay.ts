import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../env";

export function getRazorpayClient() {
  const e = env();
  const key = e.RAZORPAY_KEY_ID;
  const secret = e.RAZORPAY_KEY_SECRET;
  if (!key || !secret) return null;
  return new Razorpay({ key_id: key, key_secret: secret });
}

export async function createRazorpayOrder(amountPaise: number, receipt: string) {
  const client = getRazorpayClient();
  if (!client) return null;
  const order = await client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    payment_capture: true,
  });
  return order as { id: string; amount: number; currency: string };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const e = env();
  const secret = e.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

export function verifyRazorpayWebhookSignature(body: string, signatureHeader: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signatureHeader;
}

/** Dev / E2E bypass when Razorpay is not configured (no client). */
export function allowMockPaymentSuccess() {
  return process.env.NODE_ENV !== "production" && !getRazorpayClient();
}

/**
 * Real HMAC verify, or dev mock (`signature: "mock"`) when NODE_ENV is not production
 * (so placeholder Razorpay keys in .env do not break local checkout).
 */
export function isRazorpayVerifyOk(orderId: string, paymentId: string, signature: string) {
  if (verifyRazorpaySignature(orderId, paymentId, signature)) return true;
  if (signature === "mock" && process.env.NODE_ENV !== "production") return true;
  if (signature === "mock" && (process.env.ALLOW_MOCK_RAZORPAY_VERIFY === "true" || process.env.ALLOW_MOCK_RAZORPAY_VERIFY === "1")) {
    return true;
  }
  return false;
}
