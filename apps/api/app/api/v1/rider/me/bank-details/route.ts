import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireRider, AuthError } from "@/lib/auth/rider";

export const dynamic = "force-dynamic";

/** Get the rider's active bank account details (masked). */
export async function GET(req: Request) {
  try {
    const { profile } = await requireRider(req);

    const account = await prisma.riderBankAccount.findUnique({
      where: { riderId: profile.id },
    });

    if (!account) {
      return json({ status: "NOT_SUBMITTED", account: null });
    }

    return json({
      status: account.isActive ? "ACTIVE" : account.verificationStatus,
      account: {
        id: account.id,
        accountHolderName: account.accountHolderName,
        maskedAccountNumber: account.maskedAccountNumber,
        ifscCode: account.ifscCode,
        bankName: account.bankName,
        upiId: account.upiId,
        verificationStatus: account.verificationStatus,
        isActive: account.isActive,
        approvedAt: account.approvedAt,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
