import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { auth, profile } = await requireCustomer(req);

    const user = await prisma.user.findUnique({
      where: { id: auth.sub },
      select: { email: true, phone: true },
    });

    const orderCount = await prisma.order.count({
      where: { customerId: profile.id },
    });

    return json({
      id: profile.id,
      userId: profile.userId,
      fullName: profile.fullName,
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth?.toISOString() ?? null,
      deliveryNotes: profile.deliveryNotes,
      createdAt: profile.createdAt.toISOString(),
      stats: {
        totalOrders: orderCount,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
