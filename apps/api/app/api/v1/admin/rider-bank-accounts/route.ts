import { BankVerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/** List all rider bank accounts for admin review. */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") as BankVerificationStatus | null;

    const where: Record<string, unknown> = {};
    if (status) where.verificationStatus = status;

    const items = await prisma.riderBankAccount.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        rider: {
          select: {
            id: true,
            fullName: true,
            user: { select: { email: true, phone: true } },
          },
        },
      },
    });

    return json({
      items: items.map((a) => ({
        id: a.id,
        riderId: a.riderId,
        riderName: a.rider.fullName,
        riderEmail: a.rider.user.email,
        accountHolderName: a.accountHolderName,
        maskedAccountNumber: a.maskedAccountNumber,
        ifscCode: a.ifscCode,
        bankName: a.bankName,
        upiId: a.upiId,
        verificationStatus: a.verificationStatus,
        isActive: a.isActive,
        approvedAt: a.approvedAt,
        createdAt: a.createdAt,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
