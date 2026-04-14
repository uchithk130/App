import { z } from "zod";
import { RiderAvailability } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireRider, AuthError } from "@/lib/auth/rider";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  availability: z.enum(["AVAILABLE", "OFFLINE"]),
});

export async function PATCH(req: Request) {
  try {
    const { profile } = await requireRider(req);
    const body = bodySchema.parse(await req.json());

    const updated = await prisma.riderProfile.update({
      where: { id: profile.id },
      data: { availability: body.availability as RiderAvailability },
      select: { availability: true },
    });

    return json({ availability: updated.availability });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400);
    return errorJson("Server error", 500);
  }
}
