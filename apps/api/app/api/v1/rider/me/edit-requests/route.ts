import { z } from "zod";
import { EditRequestType, EditRequestStatus } from "@prisma/client";
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

/** Submit an edit request for profile changes (requires admin approval). */
export async function POST(req: Request) {
  try {
    const { profile } = await requireRider(req);
    const body = bodySchema.parse(await req.json());

    // Check for existing pending profile edit request
    const existing = await prisma.riderEditRequest.findFirst({
      where: {
        riderId: profile.id,
        requestType: EditRequestType.PROFILE,
        status: EditRequestStatus.PENDING,
      },
    });
    if (existing) {
      return errorJson("You already have a pending profile edit request", 409);
    }

    const currentData = {
      fullName: profile.fullName,
      vehicleType: profile.vehicleType,
      vehicleNumber: profile.vehicleNumber,
      licenseNumber: profile.licenseNumber,
      emergencyContact: profile.emergencyContact,
      address: profile.address,
    };

    const request = await prisma.riderEditRequest.create({
      data: {
        riderId: profile.id,
        requestType: EditRequestType.PROFILE,
        currentDataJson: currentData,
        submittedDataJson: body as object,
      },
    });

    return json({ id: request.id, status: request.status });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}

/** Get rider's own edit requests. */
export async function GET(req: Request) {
  try {
    const { profile } = await requireRider(req);

    const items = await prisma.riderEditRequest.findMany({
      where: { riderId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        requestType: true,
        status: true,
        submittedDataJson: true,
        reviewNotes: true,
        submittedAt: true,
        reviewedAt: true,
        maskedAccountNumber: true,
        verificationStatus: true,
        createdAt: true,
      },
    });

    return json({ items });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}
