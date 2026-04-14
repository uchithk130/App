import { z } from "zod";
import { OrderStatus, RiderApprovalStatus, WalletTransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { writeAudit } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  approvalStatus: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]).optional(),
  rejectionReason: z.string().max(500).optional(),
  fullName: z.string().min(1).max(150).optional(),
  phone: z.string().max(20).optional().nullable(),
  vehicleType: z.string().max(50).optional().nullable(),
  vehicleNumber: z.string().max(30).optional().nullable(),
  kycStatus: z.string().max(30).optional().nullable(),
  bankDetails: z
    .object({
      accountName: z.string().optional(),
      accountNumber: z.string().optional(),
      ifsc: z.string().optional(),
      bankName: z.string().optional(),
      upiId: z.string().optional(),
    })
    .optional()
    .nullable(),
});

export async function GET(req: Request, ctx: Params) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;

    const profile = await prisma.riderProfile.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, phone: true, createdAt: true } },
        wallet: { select: { balance: true, heldBalance: true } },
      },
    });
    if (!profile) return errorJson("Rider not found", 404);

    const [deliveredCount, creditAgg, reviewAgg] = await Promise.all([
      prisma.order.count({
        where: {
          status: OrderStatus.DELIVERED,
          assignment: { riderId: id },
        },
      }),
      prisma.walletTransaction.aggregate({
        where: {
          wallet: { riderId: id },
          type: WalletTransactionType.CREDIT_DELIVERY,
        },
        _sum: { amount: true },
      }),
      prisma.review.aggregate({
        where: {
          order: {
            status: OrderStatus.DELIVERED,
            assignment: { riderId: id },
          },
        },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    return json({
      id: profile.id,
      fullName: profile.fullName,
      email: profile.user.email,
      phone: profile.user.phone,
      availability: profile.availability,
      approvalStatus: profile.approvalStatus,
      approvedAt: profile.approvedAt,
      rejectionReason: profile.rejectionReason,
      vehicleType: profile.vehicleType,
      vehicleNumber: profile.vehicleNumber,
      kycStatus: profile.kycStatus,
      bankDetails: profile.bankDetailsJson,
      userCreatedAt: profile.user.createdAt,
      walletBalance: profile.wallet?.balance.toString() ?? "0",
      walletHeld: profile.wallet?.heldBalance.toString() ?? "0",
      stats: {
        ordersDelivered: deliveredCount,
        lifetimeDeliveryCredits: creditAgg._sum.amount?.toString() ?? "0",
        reviewCount: reviewAgg._count.id,
        reviewAvg: reviewAgg._avg.rating != null ? Number(reviewAgg._avg.rating.toFixed(2)) : null,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

export async function PATCH(req: Request, ctx: Params) {
  try {
    const { auth } = await requireAdmin(req);
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const existing = await prisma.riderProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true } } },
    });
    if (!existing) return errorJson("Rider not found", 404);

    // Build profile update data for non-approval fields
    const profileData: Record<string, unknown> = {};
    if (body.fullName !== undefined) profileData.fullName = body.fullName;
    if (body.vehicleType !== undefined) profileData.vehicleType = body.vehicleType;
    if (body.vehicleNumber !== undefined) profileData.vehicleNumber = body.vehicleNumber;
    if (body.kycStatus !== undefined) profileData.kycStatus = body.kycStatus;
    if (body.bankDetails !== undefined) profileData.bankDetailsJson = body.bankDetails;

    // Update phone on the User model
    if (body.phone !== undefined) {
      await prisma.user.update({ where: { id: existing.user.id }, data: { phone: body.phone } });
    }

    // Handle approval status changes
    if (body.approvalStatus === "APPROVED") {
      profileData.approvalStatus = RiderApprovalStatus.APPROVED;
      profileData.approvedAt = new Date();
      profileData.rejectionReason = null;
    } else if (body.approvalStatus === "REJECTED") {
      profileData.approvalStatus = RiderApprovalStatus.REJECTED;
      profileData.approvedAt = null;
      profileData.rejectionReason = body.rejectionReason ?? null;
    } else if (body.approvalStatus === "SUSPENDED") {
      profileData.approvalStatus = "SUSPENDED" as RiderApprovalStatus;
      profileData.rejectionReason = body.rejectionReason ?? null;
    }

    if (Object.keys(profileData).length === 0 && body.phone === undefined) {
      return errorJson("Nothing to update", 400);
    }

    const updated = Object.keys(profileData).length > 0
      ? await prisma.riderProfile.update({ where: { id }, data: profileData })
      : existing;

    await writeAudit({
      actorUserId: auth.sub,
      action: body.approvalStatus ? `rider.${body.approvalStatus.toLowerCase()}` : "rider.edit",
      entityType: "RiderProfile",
      entityId: id,
      after: body,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return json({ ok: true, approvalStatus: updated.approvalStatus });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
