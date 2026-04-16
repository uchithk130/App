import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

/** DELETE  remove a meal from favorites. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ mealId: string }> },
) {
  try {
    const { profile } = await requireCustomer(req);
    const { mealId } = await params;

    await prisma.favoriteMeal.deleteMany({
      where: { customerId: profile.id, mealId },
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Server error", 500);
  }
}
