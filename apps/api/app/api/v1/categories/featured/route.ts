import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Featured subset for home category grid. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 11, 24);

  const items = await prisma.mealCategory.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
      iconUrl: true,
    },
  });

  return json({ items });
}
