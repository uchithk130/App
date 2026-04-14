import { z } from "zod";
import { Prisma, WalletTransactionType, WithdrawalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireRider, AuthError } from "@/lib/auth/rider";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  amount: z.string().or(z.number()),
});

export async function POST(req: Request) {
  try {
    const { profile } = await requireRider(req);
    const body = bodySchema.parse(await req.json());
    const amount = new Prisma.Decimal(String(body.amount));
    if (amount.lte(0)) return errorJson("Invalid amount", 400);

    const id = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { riderId: profile.id } });
      if (!wallet) throw new Error("NO_WALLET");
      if (wallet.balance.lt(amount)) throw new Error("INSUFFICIENT");

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          heldBalance: { increment: amount },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.WITHDRAWAL_HOLD,
          amount,
          meta: { phase: "request" },
        },
      });
      const w = await tx.withdrawalRequest.create({
        data: {
          walletId: wallet.id,
          amount,
          status: WithdrawalStatus.PENDING,
        },
      });
      return w.id;
    });

    return json({ id });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    if (e instanceof Error && e.message === "INSUFFICIENT") return errorJson("Insufficient balance", 400);
    if (e instanceof Error && e.message === "NO_WALLET") return errorJson("Wallet not found", 404);
    return errorJson("Server error", 500);
  }
}
