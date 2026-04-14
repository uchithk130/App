import { z } from "zod";
import { WithdrawalStatus, WalletTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { writeAudit } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  decision: z.enum(["approve", "reject", "mark_paid"]),
  adminNote: z.string().optional(),
  bankRef: z.string().optional(),
});

export async function PATCH(req: Request, ctx: Params) {
  try {
    const { auth } = await requireAdmin(req);
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());

    await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawalRequest.findUnique({ where: { id }, include: { wallet: true } });
      if (!w) throw new Error("NOT_FOUND");
      if (w.status !== WithdrawalStatus.PENDING && body.decision !== "mark_paid") throw new Error("INVALID_STATE");

      if (body.decision === "reject") {
        await tx.wallet.update({
          where: { id: w.walletId },
          data: {
            balance: { increment: w.amount },
            heldBalance: { decrement: w.amount },
          },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: w.walletId,
            type: WalletTransactionType.WITHDRAWAL_RELEASE,
            amount: w.amount,
            reference: w.id,
            meta: { reason: "reject" },
          },
        });
        await tx.withdrawalRequest.update({
          where: { id },
          data: { status: WithdrawalStatus.REJECTED, adminNote: body.adminNote },
        });
      }

      if (body.decision === "approve") {
        await tx.withdrawalRequest.update({
          where: { id },
          data: { status: WithdrawalStatus.APPROVED, adminNote: body.adminNote },
        });
      }

      if (body.decision === "mark_paid") {
        const held = w.wallet.heldBalance;
        if (held.lt(w.amount)) throw new Error("HELD_MISMATCH");
        await tx.wallet.update({
          where: { id: w.walletId },
          data: { heldBalance: { decrement: w.amount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: w.walletId,
            type: WalletTransactionType.WITHDRAWAL_RELEASE,
            amount: w.amount,
            reference: w.id,
            meta: { phase: "paid_out" },
          },
        });
        await tx.withdrawalRequest.update({
          where: { id },
          data: { status: WithdrawalStatus.PAID, bankRef: body.bankRef, adminNote: body.adminNote },
        });
      }
    });

    await writeAudit({
      actorUserId: auth.sub,
      action: `withdrawal.${body.decision}`,
      entityType: "WithdrawalRequest",
      entityId: id,
      after: body,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    if (e instanceof Error && e.message === "NOT_FOUND") return errorJson("Not found", 404);
    if (e instanceof Error && e.message === "INVALID_STATE") return errorJson("Invalid state", 400);
    if (e instanceof Error && e.message === "HELD_MISMATCH") return errorJson("Wallet held balance mismatch", 400);
    return errorJson("Server error", 500);
  }
}
