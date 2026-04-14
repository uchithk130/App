import { prisma } from "@/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/lib/integrations/razorpay";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook — verifies signature when `RAZORPAY_WEBHOOK_SECRET` is set.
 * Idempotent: ignores duplicate payment ids.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature");
  if (process.env.RAZORPAY_WEBHOOK_SECRET && !verifyRazorpayWebhookSignature(raw, sig)) {
    return new Response("invalid signature", { status: 400 });
  }

  let payload: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const paymentId = payload.payload?.payment?.entity?.id;
  const orderId = payload.payload?.payment?.entity?.order_id;
  if (paymentId && orderId) {
    const existing = await prisma.payment.findFirst({
      where: { providerPaymentId: paymentId },
    });
    if (!existing) {
      await prisma.payment.updateMany({
        where: { providerOrderId: orderId },
        data: { providerPaymentId: paymentId, rawPayload: payload as object },
      });
    }
  }

  return new Response("ok", { status: 200 });
}
