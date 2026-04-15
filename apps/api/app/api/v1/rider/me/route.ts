import { OrderStatus, EditRequestStatus, EditRequestType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireRider, AuthError } from "@/lib/auth/rider";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { auth, profile } = await requireRider(req);

    const user = await prisma.user.findUnique({
      where: { id: auth.sub },
      select: { email: true, phone: true },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [activeCount, todayDelivered, totalDeliveries, wallet, bankAccount, pendingEdits] = await Promise.all([
      prisma.order.count({
        where: {
          assignment: { riderId: profile.id, unassignedAt: null },
          status: { in: [OrderStatus.ASSIGNED, OrderStatus.OUT_FOR_DELIVERY] },
        },
      }),
      prisma.order.count({
        where: {
          assignment: { riderId: profile.id },
          status: OrderStatus.DELIVERED,
          updatedAt: { gte: todayStart },
        },
      }),
      prisma.order.count({
        where: {
          assignment: { riderId: profile.id },
          status: OrderStatus.DELIVERED,
        },
      }),
      prisma.wallet.findUnique({
        where: { riderId: profile.id },
        select: { balance: true, heldBalance: true },
      }),
      prisma.riderBankAccount.findUnique({
        where: { riderId: profile.id },
        select: {
          accountHolderName: true,
          maskedAccountNumber: true,
          bankName: true,
          ifscCode: true,
          upiId: true,
          verificationStatus: true,
          isActive: true,
        },
      }),
      prisma.riderEditRequest.count({
        where: {
          riderId: profile.id,
          status: EditRequestStatus.PENDING,
        },
      }),
    ]);

    return json({
      id: profile.id,
      fullName: profile.fullName,
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      avatarUrl: profile.avatarUrl,
      availability: profile.availability,
      approvalStatus: profile.approvalStatus,
      vehicleType: profile.vehicleType,
      vehicleNumber: profile.vehicleNumber,
      licenseNumber: profile.licenseNumber,
      emergencyContact: profile.emergencyContact,
      address: profile.address,
      isProfileCompleted: profile.isProfileCompleted,
      bankAccount: bankAccount
        ? {
            accountHolderName: bankAccount.accountHolderName,
            maskedAccountNumber: bankAccount.maskedAccountNumber,
            bankName: bankAccount.bankName,
            ifscCode: bankAccount.ifscCode,
            upiId: bankAccount.upiId,
            verificationStatus: bankAccount.verificationStatus,
            isActive: bankAccount.isActive,
          }
        : null,
      pendingEditRequests: pendingEdits,
      stats: {
        activeOrders: activeCount,
        todayDelivered,
        totalDeliveries,
      },
      walletBalance: wallet?.balance?.toString() ?? "0",
      walletHeld: wallet?.heldBalance?.toString() ?? "0",
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
