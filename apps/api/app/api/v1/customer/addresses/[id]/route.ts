import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  line1: z.string().min(1).optional(),
  line2: z.string().nullable().optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  pincode: z.string().min(1).optional(),
  label: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  isDefault: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Params) {
  try {
    const { profile } = await requireCustomer(req);
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const existing = await prisma.address.findFirst({
      where: { id, customerId: profile.id },
    });
    if (!existing) return errorJson("Not found", 404);

    const updated = await prisma.$transaction(async (tx) => {
      if (body.isDefault === true) {
        await tx.address.updateMany({
          where: { customerId: profile.id },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id },
        data: {
          line1: body.line1?.trim(),
          line2: body.line2 === undefined ? undefined : body.line2,
          city: body.city?.trim(),
          state: body.state?.trim(),
          pincode: body.pincode?.trim(),
          label: body.label === undefined ? undefined : body.label,
          lat: body.lat === undefined ? undefined : body.lat,
          lng: body.lng === undefined ? undefined : body.lng,
          isDefault: body.isDefault,
        },
      });
    });

    return json({
      item: {
        id: updated.id,
        line1: updated.line1,
        line2: updated.line2,
        city: updated.city,
        state: updated.state,
        pincode: updated.pincode,
        label: updated.label,
        lat: updated.lat != null ? Number(updated.lat) : null,
        lng: updated.lng != null ? Number(updated.lng) : null,
        isDefault: updated.isDefault,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}

export async function DELETE(req: Request, ctx: Params) {
  try {
    const { profile } = await requireCustomer(req);
    const { id } = await ctx.params;
    const row = await prisma.address.findFirst({
      where: { id, customerId: profile.id },
    });
    if (!row) return errorJson("Not found", 404);
    await prisma.address.delete({ where: { id } });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
