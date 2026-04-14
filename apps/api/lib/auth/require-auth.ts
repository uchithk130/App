import { RoleCode } from "@prisma/client";
import { verifyAccessToken, type AccessPayload } from "./tokens";

export function getBearerToken(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice("Bearer ".length).trim();
}

export async function requireAccess(req: Request, allowed?: RoleCode[]): Promise<AccessPayload> {
  const token = getBearerToken(req);
  if (!token) throw new AuthError(401, "Unauthorized");
  const payload = await verifyAccessToken(token);
  if (!payload) throw new AuthError(401, "Invalid token");
  if (allowed?.length) {
    const ok = payload.roles.some((r) => allowed.includes(r));
    if (!ok) throw new AuthError(403, "Forbidden");
  }
  return payload;
}

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}
