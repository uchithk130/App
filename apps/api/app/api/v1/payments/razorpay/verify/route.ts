import { z } from "zod";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";
import { isRazorpayVerifyOk } from "@/lib/integrations/razorpay";
import { transitionOrderStatus } from "@/lib/services/order-transition";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  signature: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const { profile } = await requireCustomer(req);
    const body = bodySchema.parse(await req.json());

    const order = await prisma.order.findFirst({
      where: { id: body.orderId, customerId: profile.id },
      include: { payment: true },
    });
    if (!order?.payment) return errorJson("Order not found", 404);

    if (!isRazorpayVerifyOk(body.razorpayOrderId, body.razorpayPaymentId, body.signature)) {
      return errorJson("Invalid signature", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          status: PaymentStatus.CAPTURED,
          providerOrderId: body.razorpayOrderId,
          providerPaymentId: body.razorpayPaymentId,
        },
      });
      if (order.status === OrderStatus.PENDING_PAYMENT) {
        await transitionOrderStatus(tx, { orderId: order.id, to: OrderStatus.PAID });
        await transitionOrderStatus(tx, { orderId: order.id, to: OrderStatus.CONFIRMED });
      }
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
