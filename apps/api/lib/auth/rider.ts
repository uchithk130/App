import { RoleCode, RiderApprovalStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { requireAccess, AuthError } from "./require-auth";

export async function requireRider(req: Request) {
  const auth = await requireAccess(req, [RoleCode.RIDER]);
  const profile = await prisma.riderProfile.findUnique({ where: { userId: auth.sub } });
  if (!profile) throw new AuthError(403, "Rider profile missing");
  if (profile.approvalStatus === RiderApprovalStatus.PENDING) {
    throw new AuthError(403, "Your rider account is pending admin approval");
  }
  if (profile.approvalStatus === RiderApprovalStatus.REJECTED) {
    throw new AuthError(403, "Your rider registration was not approved");
  }
  return { auth, profile };
}

export { AuthError };
