import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

/** GET - single zone detail */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const zone = await prisma.serviceableZone.findFirst({
      where: { id, deletedAt: null },
      include: { pincodes: { select: { id: true, pincode: true } } },
    });
    if (!zone) return errorJson("Zone not found", 404);
    return json({
      item: {
        id: zone.id,
        name: zone.name,
        isActive: zone.isActive,
        baseDeliveryFee: zone.baseDeliveryFee.toString(),
        minOrderAmount: zone.minOrderAmount.toString(),
        taxRatePercent: zone.taxRatePercent?.toString() ?? null,
        pincodes: zone.pincodes.map((p) => p.pincode),
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  baseDeliveryFee: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  taxRatePercent: z.number().min(0).max(100).nullable().optional(),
  pincodes: z.array(z.string().min(1)).optional(),
});

/** PATCH - update zone */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const zone = await prisma.serviceableZone.findFirst({ where: { id, deletedAt: null } });
    if (!zone) return errorJson("Zone not found", 404);

    await prisma.$transaction(async (tx) => {
      await tx.serviceableZone.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          ...(body.baseDeliveryFee !== undefined ? { baseDeliveryFee: body.baseDeliveryFee } : {}),
          ...(body.minOrderAmount !== undefined ? { minOrderAmount: body.minOrderAmount } : {}),
          ...(body.taxRatePercent !== undefined ? { taxRatePercent: body.taxRatePercent } : {}),
        },
      });

      if (body.pincodes !== undefined) {
        await tx.zonePincode.deleteMany({ where: { zoneId: id } });
        if (body.pincodes.length > 0) {
          await tx.zonePincode.createMany({
            data: body.pincodes.map((p) => ({ zoneId: id, pincode: p.trim() })),
          });
        }
      }
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}

/** DELETE - soft delete zone */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    await prisma.serviceableZone.update({ where: { id }, data: { deletedAt: new Date() } });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
