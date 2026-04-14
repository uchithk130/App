import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireRider, AuthError } from "@/lib/auth/rider";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { profile } = await requireRider(req);
    const wallet = await prisma.wallet.findUnique({
      where: { riderId: profile.id },
      include: {
        txs: { orderBy: { createdAt: "desc" }, take: 50 },
        withdrawals: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!wallet) return errorJson("Wallet not found", 404);
    return json({
      balance: wallet.balance.toString(),
      heldBalance: wallet.heldBalance.toString(),
      transactions: wallet.txs.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toString(),
        reference: t.reference,
        createdAt: t.createdAt,
      })),
      withdrawals: wallet.withdrawals.map((w) => ({
        id: w.id,
        amount: w.amount.toString(),
        status: w.status,
        createdAt: w.createdAt,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
