import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/** GET - list all zones with pincodes */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const items = await prisma.serviceableZone.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        pincodes: { select: { id: true, pincode: true }, orderBy: { pincode: "asc" } },
        _count: { select: { orders: true } },
      },
    });
    return json({
      items: items.map((z) => ({
        id: z.id,
        name: z.name,
        isActive: z.isActive,
        baseDeliveryFee: z.baseDeliveryFee.toString(),
        minOrderAmount: z.minOrderAmount.toString(),
        taxRatePercent: z.taxRatePercent?.toString() ?? null,
        pincodes: z.pincodes.map((p) => p.pincode),
        orderCount: z._count.orders,
        createdAt: z.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().optional(),
  baseDeliveryFee: z.number().min(0),
  minOrderAmount: z.number().min(0),
  taxRatePercent: z.number().min(0).max(100).nullable().optional(),
  pincodes: z.array(z.string().min(1)).min(1),
});

/** POST - create a new zone */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = createSchema.parse(await req.json());

    const zone = await prisma.serviceableZone.create({
      data: {
        name: body.name,
        isActive: body.isActive ?? true,
        baseDeliveryFee: body.baseDeliveryFee,
        minOrderAmount: body.minOrderAmount,
        taxRatePercent: body.taxRatePercent ?? null,
        pincodes: {
          create: body.pincodes.map((p) => ({ pincode: p.trim() })),
        },
      },
      include: { pincodes: { select: { pincode: true } } },
    });

    return json({ item: { id: zone.id, name: zone.name } });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
