import { RoleCode } from "@prisma/client";
import { prisma } from "../prisma";
import { requireAccess, AuthError } from "./require-auth";

export async function requireAdmin(req: Request) {
  const auth = await requireAccess(req, [RoleCode.ADMIN]);
  const profile = await prisma.adminProfile.findUnique({ where: { userId: auth.sub } });
  if (!profile) throw new AuthError(403, "Admin profile missing");
  return { auth, profile };
}

export { AuthError };
