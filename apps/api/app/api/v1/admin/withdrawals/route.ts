import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 200);

    const items = await prisma.withdrawalRequest.findMany({
      where: status ? { status: status as never } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        wallet: {
          include: {
            rider: {
              select: {
                id: true,
                fullName: true,
                bankDetailsJson: true,
                user: { select: { email: true, phone: true } },
              },
            },
          },
        },
      },
    });

    return json({
      items: items.map((w) => ({
        id: w.id,
        amount: w.amount.toString(),
        status: w.status,
        bankRef: w.bankRef,
        adminNote: w.adminNote,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
        rider: {
          id: w.wallet.rider.id,
          fullName: w.wallet.rider.fullName,
          email: w.wallet.rider.user.email,
          phone: w.wallet.rider.user.phone,
          bankDetails: w.wallet.rider.bankDetailsJson,
        },
        walletBalance: w.wallet.balance.toString(),
        walletHeld: w.wallet.heldBalance.toString(),
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
