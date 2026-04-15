import { z } from "zod";
import { BankVerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorJson, json } from "@/lib/http";
import { requireAdmin, AuthError } from "@/lib/auth/admin";
import { writeAudit } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: Request, ctx: Params) {
  try {
    const { auth } = await requireAdmin(req);
    const { id } = await ctx.params;
    const body = actionSchema.parse(await req.json());

    const account = await prisma.riderBankAccount.findUnique({ where: { id } });
    if (!account) return errorJson("Bank account not found", 404);

    if (body.action === "approve") {
      await prisma.riderBankAccount.update({
        where: { id },
        data: {
          verificationStatus: BankVerificationStatus.VERIFIED,
          isActive: true,
          approvedByAdminId: auth.sub,
          approvedAt: new Date(),
          verifiedAt: new Date(),
        },
      });
    } else {
      await prisma.riderBankAccount.update({
        where: { id },
        data: {
          verificationStatus: BankVerificationStatus.VERIFICATION_FAILED,
          isActive: false,
        },
      });
    }

    await writeAudit({
      actorUserId: auth.sub,
      action: `rider_bank.${body.action}`,
      entityType: "RiderBankAccount",
      entityId: id,
      after: { action: body.action, notes: body.notes },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status, "AUTH");
    if (e instanceof z.ZodError) return errorJson("Invalid body", 400, "VALIDATION", e.flatten());
    return errorJson("Server error", 500);
  }
}
