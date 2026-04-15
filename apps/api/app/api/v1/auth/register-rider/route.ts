import { z } from "zod";
import { AppScope, RoleCode, RiderApprovalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { hashPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  phone: z.string().min(8).optional(),
  vehicleType: z.string().min(1).optional(),
  vehicleNumber: z.string().min(1).optional(),
});

/** Self-serve rider signup. App-scoped: only checks rider accounts. */
export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const roleRider = await prisma.role.findUnique({ where: { code: RoleCode.RIDER } });
    if (!roleRider) return errorJson("Roles not seeded", 500);

    // Check ONLY rider-scoped accounts
    const existing = await prisma.user.findUnique({
      where: { email_appScope: { email, appScope: AppScope.RIDER } },
      include: { riderProfile: true },
    });

    if (existing) {
      const status = existing.riderProfile?.approvalStatus;
      if (status === RiderApprovalStatus.PENDING) {
        return errorJson(
          "Your rider application is already pending admin approval.",
          409,
          "RIDER_PENDING",
        );
      }
      if (status === RiderApprovalStatus.APPROVED) {
        return errorJson(
          "A rider account with this email already exists. Please log in.",
          409,
          "ALREADY_RIDER",
        );
      }
      if (status === RiderApprovalStatus.REJECTED) {
        return errorJson(
          "Your previous rider application was not approved. Please contact support.",
          409,
          "RIDER_REJECTED",
        );
      }
      if (status === (RiderApprovalStatus as Record<string, string>).SUSPENDED) {
        return errorJson(
          "Your rider account has been suspended. Please contact support.",
          409,
          "RIDER_SUSPENDED",
        );
      }
      return errorJson(
        "A rider account with this email already exists.",
        409,
      );
    }

    // Create a new rider-scoped User
    const passwordHash = await hashPassword(body.password);
    await prisma.user.create({
      data: {
        email,
        phone: body.phone,
        passwordHash,
        appScope: AppScope.RIDER,
        roles: { create: [{ roleId: roleRider.id }] },
        riderProfile: {
          create: {
            fullName: body.fullName,
            vehicleType: body.vehicleType,
            vehicleNumber: body.vehicleNumber,
            wallet: { create: {} },
          },
        },
      },
    });

    return json({
      ok: true,
      message: "Registration submitted. An admin will approve your account before you can sign in.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
