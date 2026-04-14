import { RoleCode } from "@prisma/client";
import { prisma } from "../prisma";
import { requireAccess, AuthError } from "./require-auth";

export async function requireCustomer(req: Request) {
  const auth = await requireAccess(req, [RoleCode.CUSTOMER]);
  const profile = await prisma.customerProfile.findUnique({ where: { userId: auth.sub } });
  if (!profile) throw new AuthError(403, "Customer profile missing");
  return { auth, profile };
}

export { AuthError };
