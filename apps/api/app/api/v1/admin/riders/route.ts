import { RiderApprovalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const approval = url.searchParams.get("approval");

    const where =
      approval === "pending"
        ? { approvalStatus: RiderApprovalStatus.PENDING }
        : approval === "approved"
          ? { approvalStatus: RiderApprovalStatus.APPROVED }
          : approval === "rejected"
            ? { approvalStatus: RiderApprovalStatus.REJECTED }
            : {};

    const items = await prisma.riderProfile.findMany({
      where,
      take: 200,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        availability: true,
        approvalStatus: true,
        vehicleNumber: true,
        vehicleType: true,
        createdAt: true,
      },
    });
    return json({ items });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
