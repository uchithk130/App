import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Public: active meal categories for customer app (admin-managed). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const featured = url.searchParams.get("featured") === "1";
  const limit = Math.min(Number(url.searchParams.get("limit")) || (featured ? 12 : 200), 200);

  const items = await prisma.mealCategory.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      ...(featured ? { isFeatured: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      sortOrder: true,
      iconUrl: true,
      isFeatured: true,
    },
  });

  return json({ items });
}
