import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/** Customer profiles for admin pickers (coupons, etc.). */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
    const search = q && q.length >= 1
      ? { OR: [
          { fullName: { contains: q, mode: "insensitive" as const } },
          { user: { email: { contains: q, mode: "insensitive" as const } } },
        ] }
      : {};
    const rows = await prisma.customerProfile.findMany({
      where: { user: { deletedAt: null }, ...search },
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        user: { select: { email: true, phone: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { fullName: "asc" },
      take: limit,
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
