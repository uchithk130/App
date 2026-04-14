import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireRider, AuthError } from "@/lib/auth/rider";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/** POST /rider/location - rider pushes GPS coordinates */
export async function POST(req: Request) {
  try {
    const { profile } = await requireRider(req);
    const body = bodySchema.parse(await req.json());

    await prisma.riderProfile.update({
      where: { id: profile.id },
      data: {
        lastKnownLat: body.lat,
        lastKnownLng: body.lng,
        locationUpdatedAt: new Date(),
      },
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
