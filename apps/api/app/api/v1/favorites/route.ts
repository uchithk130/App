import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";
import { customerMealImageUrl } from "@/lib/meal-image-customer";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** GET   list the customer's favorite meals. */
export async function GET(req: Request) {
  try {
    const { profile } = await requireCustomer(req);

    const favs = await prisma.favoriteMeal.findMany({
      where: { customerId: profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        meal: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            compareAtPrice: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
            nutrition: { select: { calories: true, proteinG: true } },
            isActive: true,
            deletedAt: true,
          },
        },
      },
    });

    const items = favs
      .filter((f) => f.meal.isActive && !f.meal.deletedAt)
      .map((f) => ({
        mealId: f.meal.id,
        name: f.meal.name,
        slug: f.meal.slug,
        basePrice: f.meal.basePrice.toString(),
        compareAtPrice: f.meal.compareAtPrice?.toString() ?? null,
        coverUrl: customerMealImageUrl(req, f.meal.images[0]?.url ?? null),
        calories: f.meal.nutrition?.calories ?? null,
        proteinG: f.meal.nutrition?.proteinG?.toString() ?? null,
        favoritedAt: f.createdAt.toISOString(),
      }));

    return json({ items });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Server error", 500);
  }
}

const addSchema = z.object({ mealId: z.string().min(1) });

/** POST  add a meal to favorites. */
export async function POST(req: Request) {
  try {
    const { profile } = await requireCustomer(req);
    const body = addSchema.parse(await req.json());

    const meal = await prisma.meal.findFirst({
      where: { id: body.mealId, isActive: true, deletedAt: null },
    });
    if (!meal) return errorJson("Meal not found", 404);

    await prisma.favoriteMeal.upsert({
      where: { customerId_mealId: { customerId: profile.id, mealId: body.mealId } },
      create: { customerId: profile.id, mealId: body.mealId },
      update: {},
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400);
    return errorJson("Server error", 500);
  }
}
