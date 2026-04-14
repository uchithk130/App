import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";
import { customerMealImageUrl } from "@/lib/meal-image-customer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { profile } = await requireCustomer(req);
    const cart = await prisma.cart.upsert({
      where: { customerId: profile.id },
      update: {},
      create: { customerId: profile.id },
      include: {
        items: {
          include: {
            meal: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                compareAtPrice: true,
                images: { take: 1, orderBy: { sortOrder: "asc" } },
                nutrition: true,
              },
            },
          },
        },
      },
    });
    return json({
      id: cart.id,
      items: cart.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toString(),
        meal: {
          id: i.meal.id,
          name: i.meal.name,
          slug: i.meal.slug,
          basePrice: i.meal.basePrice.toString(),
          compareAtPrice: i.meal.compareAtPrice?.toString() ?? null,
          coverUrl: customerMealImageUrl(req, i.meal.images[0]?.url) ?? null,
          nutrition: i.meal.nutrition
            ? {
                calories: i.meal.nutrition.calories,
                proteinG: i.meal.nutrition.proteinG.toString(),
                carbG: i.meal.nutrition.carbG.toString(),
                fatG: i.meal.nutrition.fatG.toString(),
                fiberG: i.meal.nutrition.fiberG.toString(),
              }
            : null,
        },
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
