import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireCustomer, AuthError } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ addressId: z.string().min(1) });

/** Set one address as default (selected delivery location). */
export async function POST(req: Request) {
  try {
    const { profile } = await requireCustomer(req);
    const body = bodySchema.parse(await req.json());

    const addr = await prisma.address.findFirst({
      where: { id: body.addressId, customerId: profile.id },
    });
    if (!addr) return errorJson("Not found", 404);

    await prisma.$transaction([
      prisma.address.updateMany({
        where: { customerId: profile.id },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: addr.id },
        data: { isDefault: true },
      }),
    ]);

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
