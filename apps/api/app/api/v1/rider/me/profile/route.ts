import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireRider, AuthError } from "@/lib/auth/rider";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  fullName: z.string().min(1).max(150).optional(),
  vehicleType: z.string().max(50).optional().nullable(),
  vehicleNumber: z.string().max(30).optional().nullable(),
  licenseNumber: z.string().max(50).optional().nullable(),
  emergencyContact: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

/** First-time profile completion after admin approval. */
export async function PATCH(req: Request) {
  try {
    const { profile } = await requireRider(req);
    const body = bodySchema.parse(await req.json());

    const data: Record<string, unknown> = {};
    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.vehicleType !== undefined) data.vehicleType = body.vehicleType;
    if (body.vehicleNumber !== undefined) data.vehicleNumber = body.vehicleNumber;
    if (body.licenseNumber !== undefined) data.licenseNumber = body.licenseNumber;
    if (body.emergencyContact !== undefined) data.emergencyContact = body.emergencyContact;
    if (body.address !== undefined) data.address = body.address;

    if (Object.keys(data).length === 0) {
      return errorJson("Nothing to update", 400);
    }

    // If profile is not yet completed, mark it completed
    if (!profile.isProfileCompleted) {
      data.isProfileCompleted = true;
    }

    const updated = await prisma.riderProfile.update({
      where: { id: profile.id },
      data,
    });

    return json({ ok: true, isProfileCompleted: updated.isProfileCompleted });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
