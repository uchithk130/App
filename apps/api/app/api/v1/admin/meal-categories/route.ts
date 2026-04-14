import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const items = await prisma.mealCategory.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        iconUrl: true,
        sortOrder: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
        _count: { select: { meals: true } },
      },
    });
    return json({
      items: items.map((c) => ({
        ...c,
        mealCount: c._count.meals,
        _count: undefined,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  iconUrl: z.string().url().optional().nullable().or(z.literal("").transform(() => null)),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = createSchema.parse(await req.json());

    const existing = await prisma.mealCategory.findUnique({ where: { slug: body.slug } });
    if (existing && !existing.deletedAt) return errorJson("Category slug already exists", 409);

    const cat = await prisma.mealCategory.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        iconUrl: body.iconUrl ?? null,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
        isFeatured: body.isFeatured,
      },
    });
    return json(cat, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Validation error", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
