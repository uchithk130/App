import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/** Customer profiles for admin pickers (coupons, etc.). */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const rows = await prisma.customerProfile.findMany({
      where: { user: { deletedAt: null } },
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        user: { select: { email: true, phone: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { fullName: "asc" },
      take: 2000,
    });
    return json({
      items: rows.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        email: r.user.email,
        phone: r.user.phone,
        orderCount: r._count.orders,
        memberSince: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
