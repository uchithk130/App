import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { presignMealImageUpload, publicUrlForKey } from "@/lib/integrations/s3";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mealId: z.string().min(1).optional(),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  fileSizeBytes: z.number().int().max(5 * 1024 * 1024),
});

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = bodySchema.parse(await req.json());
    if (body.mealId) {
      const meal = await prisma.meal.findFirst({ where: { id: body.mealId, deletedAt: null } });
      if (!meal) return errorJson("Meal not found", 404);
    }

    const ext = body.contentType === "image/png" ? "png" : body.contentType === "image/webp" ? "webp" : "jpg";
    const key = body.mealId
      ? `meals/${body.mealId}/${randomUUID()}.${ext}`
      : `meals/staging/${randomUUID()}.${ext}`;
    const uploadUrl = await presignMealImageUpload(key, body.contentType);
    if (!uploadUrl) {
      return json({
        mock: true,
        key,
        publicUrl: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&mockKey=${encodeURIComponent(key)}`,
      });
    }
    return json({ uploadUrl, key, publicUrl: publicUrlForKey(key) });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
