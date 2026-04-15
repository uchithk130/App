import { EditRequestStatus, EditRequestType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/** List rider edit requests for admin review. */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") as EditRequestStatus | null;
    const type = url.searchParams.get("type") as EditRequestType | null;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.requestType = type;

    const items = await prisma.riderEditRequest.findMany({
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
      items: items.map((r) => ({
        id: r.id,
        riderId: r.riderId,
        riderName: r.rider.fullName,
        riderEmail: r.rider.user.email,
        requestType: r.requestType,
        status: r.status,
        currentDataJson: r.currentDataJson,
        submittedDataJson: r.submittedDataJson,
        maskedAccountNumber: r.maskedAccountNumber,
        verificationStatus: r.verificationStatus,
        reviewNotes: r.reviewNotes,
        submittedAt: r.submittedAt,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
