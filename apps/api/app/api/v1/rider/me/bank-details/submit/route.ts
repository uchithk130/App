import { z } from "zod";
import { BankVerificationStatus, EditRequestType, EditRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireRider, AuthError } from "@/lib/auth/rider";
import { maskAccountNumber, encryptAccountNumber } from "@/lib/services/bank-utils";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  accountHolderName: z.string().min(1).max(200),
  accountNumber: z.string().min(5).max(30),
  ifscCode: z.string().min(4).max(20),
  bankName: z.string().max(100).optional(),
  upiId: z.string().max(100).optional(),
});

/**
 * Submit bank details.
 * First submission: creates RiderBankAccount (pending verification + admin approval).
 * Subsequent: creates an edit request (requires admin approval).
 */
export async function POST(req: Request) {
  try {
    const { profile } = await requireRider(req);
    const body = bodySchema.parse(await req.json());

    const masked = maskAccountNumber(body.accountNumber);
    const encrypted = encryptAccountNumber(body.accountNumber);

    const existing = await prisma.riderBankAccount.findUnique({
      where: { riderId: profile.id },
    });

    if (!existing) {
      const account = await prisma.riderBankAccount.create({
        data: {
          riderId: profile.id,
          accountHolderName: body.accountHolderName,
          maskedAccountNumber: masked,
          accountNumberEncrypted: encrypted,
          ifscCode: body.ifscCode,
          bankName: body.bankName,
          upiId: body.upiId,
          verificationStatus: BankVerificationStatus.PENDING_VERIFICATION,
          isActive: false,
        },
      });

      return json({
        id: account.id,
        status: "PENDING_VERIFICATION",
        message: "Bank details submitted for verification and admin approval.",
      });
    }

    const pendingEdit = await prisma.riderEditRequest.findFirst({
      where: {
        riderId: profile.id,
        requestType: EditRequestType.BANK_DETAILS,
        status: EditRequestStatus.PENDING,
      },
    });
    if (pendingEdit) {
      return errorJson("You already have a pending bank details change request", 409);
    }

    const currentData = {
      accountHolderName: existing.accountHolderName,
      maskedAccountNumber: existing.maskedAccountNumber,
      ifscCode: existing.ifscCode,
      bankName: existing.bankName,
      upiId: existing.upiId,
    };

    const request = await prisma.riderEditRequest.create({
      data: {
        riderId: profile.id,
        requestType: EditRequestType.BANK_DETAILS,
        currentDataJson: currentData,
        submittedDataJson: {
          accountHolderName: body.accountHolderName,
          ifscCode: body.ifscCode,
          bankName: body.bankName,
          upiId: body.upiId,
        },
        maskedAccountNumber: masked,
        accountNumberEncrypted: encrypted,
        verificationStatus: BankVerificationStatus.PENDING_VERIFICATION,
      },
    });

    return json({
      id: request.id,
      status: "PENDING",
      message: "Bank details change request submitted for review.",
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
