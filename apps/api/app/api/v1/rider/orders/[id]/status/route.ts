import { z } from "zod";
import { OrderStatus, Prisma, WalletTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireRider, AuthError } from "@/lib/auth/rider";
import { transitionOrderStatus, canRiderTransition } from "@/lib/services/order-transition";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional(),
});

async function settingBoolTx(tx: Prisma.TransactionClient, key: string, def: boolean) {
  const row = await tx.adminSetting.findUnique({ where: { key } });
  if (row?.value === undefined || row.value === null) return def;
  return Boolean(row.value);
}

export async function PATCH(req: Request, ctx: Params) {
  try {
    const { profile } = await requireRider(req);
    const { id: orderId } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    const order = await prisma.order.findFirst({
      where: { id: orderId, assignment: { riderId: profile.id, unassignedAt: null } },
      include: { payment: true },
    });
    if (!order) return errorJson("Not found", 404);

    if (!canRiderTransition(order.status, body.status)) return errorJson("Invalid status transition", 400);

    await prisma.$transaction(async (tx) => {
      await transitionOrderStatus(tx, {
        orderId,
        to: body.status,
        note: body.note,
        changedByRole: "RIDER",
        changedByUserId: profile.userId,
      });

      if (body.status === OrderStatus.DELIVERED) {
        const method = order.payment?.method ?? "";
        const creditCod = await settingBoolTx(tx, "rider.wallet.creditOnCod", false);
        const shouldCredit = method !== "COD" || creditCod;
        if (shouldCredit) {
          const already = await tx.walletTransaction.findFirst({
            where: { reference: orderId, type: WalletTransactionType.CREDIT_DELIVERY },
          });
          if (!already) {
            const wallet = await tx.wallet.findUnique({ where: { riderId: profile.id } });
            if (wallet) {
              const commission = new Prisma.Decimal(45);
              await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: commission } },
              });
              await tx.walletTransaction.create({
                data: {
                  walletId: wallet.id,
                  type: WalletTransactionType.CREDIT_DELIVERY,
                  amount: commission,
                  reference: orderId,
                  meta: { orderId },
                },
              });
            }
          }
        }
      }
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
