import { z } from "zod";
import { EditRequestStatus, EditRequestType, BankVerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { writeAudit } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNotes: z.string().max(1000).optional(),
});

export async function GET(req: Request, ctx: Params) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;

    const request = await prisma.riderEditRequest.findUnique({
      where: { id },
      include: {
        rider: {
          select: {
            id: true,
            fullName: true,
            vehicleType: true,
            vehicleNumber: true,
            licenseNumber: true,
            emergencyContact: true,
            address: true,
            user: { select: { email: true, phone: true } },
            bankAccount: {
              select: {
                accountHolderName: true,
                maskedAccountNumber: true,
                ifscCode: true,
                bankName: true,
                upiId: true,
                verificationStatus: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!request) return errorJson("Request not found", 404);
    return json(request);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    return errorJson("Server error", 500);
  }
}

export async function POST(req: Request, ctx: Params) {
  try {
    const { auth } = await requireAdmin(req);
    const { id } = await ctx.params;
    const body = actionSchema.parse(await req.json());

    const request = await prisma.riderEditRequest.findUnique({
      where: { id },
      include: { rider: true },
    });
    if (!request) return errorJson("Request not found", 404);
    if (request.status !== EditRequestStatus.PENDING) {
      return errorJson("Request already reviewed", 400);
    }

    const newStatus = body.action === "approve" ? EditRequestStatus.APPROVED : EditRequestStatus.REJECTED;

    if (body.action === "approve") {
      if (request.requestType === EditRequestType.PROFILE) {
        // Apply profile changes
        const data = request.submittedDataJson as Record<string, unknown>;
        const profileUpdate: Record<string, unknown> = {};
        if (data.fullName !== undefined) profileUpdate.fullName = data.fullName;
        if (data.vehicleType !== undefined) profileUpdate.vehicleType = data.vehicleType;
        if (data.vehicleNumber !== undefined) profileUpdate.vehicleNumber = data.vehicleNumber;
        if (data.licenseNumber !== undefined) profileUpdate.licenseNumber = data.licenseNumber;
        if (data.emergencyContact !== undefined) profileUpdate.emergencyContact = data.emergencyContact;
        if (data.address !== undefined) profileUpdate.address = data.address;

        if (Object.keys(profileUpdate).length > 0) {
          await prisma.riderProfile.update({
            where: { id: request.riderId },
            data: profileUpdate,
          });
        }
      } else if (request.requestType === EditRequestType.BANK_DETAILS) {
        // Apply bank details changes
        const data = request.submittedDataJson as Record<string, unknown>;
        await prisma.riderBankAccount.upsert({
          where: { riderId: request.riderId },
          update: {
            accountHolderName: data.accountHolderName as string,
            maskedAccountNumber: request.maskedAccountNumber!,
            accountNumberEncrypted: request.accountNumberEncrypted!,
            ifscCode: data.ifscCode as string,
            bankName: (data.bankName as string) ?? null,
            upiId: (data.upiId as string) ?? null,
            verificationStatus: BankVerificationStatus.VERIFIED,
            isActive: true,
            approvedByAdminId: auth.sub,
            approvedAt: new Date(),
          },
          create: {
            riderId: request.riderId,
            accountHolderName: data.accountHolderName as string,
            maskedAccountNumber: request.maskedAccountNumber!,
            accountNumberEncrypted: request.accountNumberEncrypted!,
            ifscCode: data.ifscCode as string,
            bankName: (data.bankName as string) ?? null,
            upiId: (data.upiId as string) ?? null,
            verificationStatus: BankVerificationStatus.VERIFIED,
            isActive: true,
            approvedByAdminId: auth.sub,
            approvedAt: new Date(),
          },
        });
      }
    }

    await prisma.riderEditRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewNotes: body.reviewNotes ?? null,
        reviewedAt: new Date(),
        reviewedByAdminId: auth.sub,
      },
    });

    await writeAudit({
      actorUserId: auth.sub,
      action: `rider_edit_request.${body.action}`,
      entityType: "RiderEditRequest",
      entityId: id,
      after: { requestType: request.requestType, action: body.action },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return json({ ok: true, status: newStatus });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
