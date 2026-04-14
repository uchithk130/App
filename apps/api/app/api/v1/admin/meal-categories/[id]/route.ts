import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Params) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;

    const cat = await prisma.mealCategory.findFirst({ where: { id, deletedAt: null } });
    if (!cat) return errorJson("Category not found", 404);

    const schema = z.object({
      name: z.string().min(1).max(100).optional(),
      slug: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional().nullable(),
      iconUrl: z.string().url().optional().nullable().or(z.literal("").transform(() => null)),
      sortOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
    });

    const body = schema.parse(await req.json());

    if (body.slug && body.slug !== cat.slug) {
      const dup = await prisma.mealCategory.findUnique({ where: { slug: body.slug } });
      if (dup && dup.id !== id && !dup.deletedAt) {
        return errorJson("Slug already in use", 409);
      }
    }

    const updated = await prisma.mealCategory.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.iconUrl !== undefined && { iconUrl: body.iconUrl }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
      },
    });

    return json(updated);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Validation error", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}

export async function DELETE(req: Request, ctx: Params) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;

    const cat = await prisma.mealCategory.findFirst({ where: { id, deletedAt: null } });
    if (!cat) return errorJson("Category not found", 404);

    const mealCount = await prisma.meal.count({ where: { categoryId: id, deletedAt: null } });
    if (mealCount > 0) {
      return errorJson(`Cannot delete: ${mealCount} meal(s) still linked to this category`, 409);
    }

    await prisma.mealCategory.update({ where: { id }, data: { deletedAt: new Date() } });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
