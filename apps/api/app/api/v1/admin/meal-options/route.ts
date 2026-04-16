import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
    const search = q && q.length >= 1
      ? { name: { contains: q, mode: "insensitive" as const } }
      : {};
    const rows = await prisma.meal.findMany({
      where: { deletedAt: null, ...search },
      select: { id: true, name: true, category: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: limit,
    });
    return json({
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category?.name ?? null,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
