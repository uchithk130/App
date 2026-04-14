import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { putMealImageObject, publicUrlForKey } from "@/lib/integrations/s3";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function extForType(ct: string): string {
  if (ct === "image/png") return "png";
  if (ct === "image/webp") return "webp";
  return "jpg";
}

/**
 * Multipart meal image upload (field `file`, optional `mealId`).
 * Uses server → S3 so the browser never does a cross-origin PUT (no S3 CORS setup required).
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const form = await req.formData();
    const mealIdRaw = form.get("mealId");
    const mealId = typeof mealIdRaw === "string" && mealIdRaw.length > 0 ? mealIdRaw : undefined;
    const blob = form.get("file");

    if (!blob || !(blob instanceof Blob)) {
      return errorJson("Missing file field", 400);
    }
    if (blob.size > MAX_BYTES) {
      return errorJson("Image must be under 5MB", 400);
    }
    const contentType = blob.type;
    if (!allowedTypes.has(contentType)) {
      return errorJson("Only JPEG, PNG, or WebP images are allowed", 400);
    }

    if (mealId) {
      const meal = await prisma.meal.findFirst({ where: { id: mealId, deletedAt: null } });
      if (!meal) return errorJson("Meal not found", 404);
    }

    const ext = extForType(contentType);
    const key = mealId ? `meals/${mealId}/${randomUUID()}.${ext}` : `meals/staging/${randomUUID()}.${ext}`;
    const buf = Buffer.from(await blob.arrayBuffer());

    const ok = await putMealImageObject(key, contentType, buf);
    if (!ok) {
      return json({
        mock: true,
        key,
        publicUrl: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&mockKey=${encodeURIComponent(key)}`,
      });
    }

    const pub = publicUrlForKey(key);
    if (!pub) return errorJson("Set S3_PUBLIC_BASE_URL in API env for public image URLs", 500);

    return json({ key, publicUrl: pub });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
