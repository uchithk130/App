import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Params) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;

    const profile = await prisma.customerProfile.findFirst({
      where: { id, user: { deletedAt: null } },
      include: {
        user: { select: { email: true, phone: true, createdAt: true } },
        addresses: {
          take: 5,
          orderBy: { isDefault: "desc" },
          select: {
            id: true,
            line1: true,
            city: true,
            state: true,
            pincode: true,
            isDefault: true,
          },
        },
      },
    });
    if (!profile) return errorJson("Customer not found", 404);

    const [orderAgg, recentOrders, favorites] = await Promise.all([
      prisma.order.aggregate({
        where: { customerId: id },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: { customerId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          type: true,
          total: true,
          createdAt: true,
        },
      }),
      prisma.favoriteMeal.findMany({
        where: { customerId: id },
        include: {
          meal: { select: { id: true, name: true, slug: true, basePrice: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    return json({
      id: profile.id,
      fullName: profile.fullName,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth?.toISOString() ?? null,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg?.toString() ?? null,
      activityLevel: profile.activityLevel,
      fitnessGoal: profile.fitnessGoal,
      dietaryPreference: profile.dietaryPreference,
      allergies: profile.allergies,
      intolerances: profile.intolerances,
      healthNotes: profile.healthNotes,
      preferredMealTimes: profile.preferredMealTimes,
      dailyCalorieGoal: profile.dailyCalorieGoal,
      targetProteinG: profile.targetProteinG,
      targetCarbG: profile.targetCarbG,
      targetFatG: profile.targetFatG,
      emergencyContact: profile.emergencyContact,
      deliveryNotes: profile.deliveryNotes,
      email: profile.user.email,
      phone: profile.user.phone,
      userCreatedAt: profile.user.createdAt.toISOString(),
      profileCreatedAt: profile.createdAt.toISOString(),
      addresses: profile.addresses,
      stats: {
        orderCount: orderAgg._count._all,
        lifetimeSpend: orderAgg._sum.total?.toString() ?? "0",
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        type: o.type,
        total: o.total.toString(),
        createdAt: o.createdAt.toISOString(),
      })),
      favorites: favorites.map((f) => ({
        mealId: f.mealId,
        name: f.meal.name,
        slug: f.meal.slug,
        basePrice: f.meal.basePrice.toString(),
        savedAt: f.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
