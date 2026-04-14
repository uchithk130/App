import { z } from "zod";
import { RoleCode } from "@prisma/client";
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

/** Self-serve rider signup — account stays PENDING until an admin approves. */
export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const email = body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorJson("Email already registered", 409);

    const roleRider = await prisma.role.findUnique({ where: { code: RoleCode.RIDER } });
    if (!roleRider) return errorJson("Roles not seeded", 500);

    const passwordHash = await hashPassword(body.password);
    await prisma.user.create({
      data: {
        email,
        phone: body.phone,
        passwordHash,
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
