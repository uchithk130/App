import { z } from "zod";
import { Prisma, WalletTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  amount: z.number().positive().max(10000),
});

/** POST /orders/:id/tip -- create tip for rider */
export async function POST(req: Request, ctx: Params) {
  try {
    const { profile } = await requireCustomer(req);
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const order = await prisma.order.findFirst({
      where: { id, customerId: profile.id, status: "DELIVERED" },
      include: { assignment: { include: { rider: { include: { wallet: true } } } } },
    });
    if (!order) return errorJson("Order not found or not delivered", 404);
    if (!order.assignment) return errorJson("No rider assigned", 400);

    const existing = await prisma.tipTransaction.findUnique({
      where: { orderId_customerId: { orderId: id, customerId: profile.id } },
    });
    if (existing) return errorJson("Tip already submitted", 409);

    const riderId = order.assignment.riderId;
    const tipAmount = new Prisma.Decimal(body.amount);

    const tip = await prisma.$transaction(async (tx) => {
      const created = await tx.tipTransaction.create({
        data: {
          orderId: id,
          customerId: profile.id,
          riderId,
          amount: tipAmount,
          status: "paid",
        },
      });

      // Credit rider wallet
      const wallet = await tx.wallet.findUnique({ where: { riderId } });
      if (wallet) {
        await tx.wallet.update({
          where: { riderId },
          data: { balance: { increment: tipAmount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: WalletTransactionType.CREDIT_DELIVERY,
            amount: tipAmount,
            reference: `TIP:${created.id}`,
            meta: { orderId: id, tipId: created.id },
          },
        });
      }

      return created;
    });

    await prisma.postDeliveryFlowState.upsert({
      where: { orderId: id },
      create: { orderId: id, customerId: profile.id, tipHandled: true },
      update: { tipHandled: true },
    });

    return json({ id: tip.id, amount: tip.amount.toString(), status: tip.status });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
