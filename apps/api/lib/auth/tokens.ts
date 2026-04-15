import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "crypto";
import { RoleCode } from "@prisma/client";
import { env } from "../env";

const textEncoder = new TextEncoder();

export type AccessPayload = {
  sub: string;
  roles: RoleCode[];
  scope: string;
  typ: "access";
};

export async function signAccessToken(payload: Omit<AccessPayload, "typ">) {
  const e = env();
  const secret = textEncoder.encode(e.JWT_ACCESS_SECRET);
  const token = await new SignJWT({ roles: payload.roles, scope: payload.scope, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(e.JWT_ACCESS_EXPIRES_IN)
    .sign(secret);
  return token;
}

export async function verifyAccessToken(token: string): Promise<AccessPayload | null> {
  try {
    const e = env();
    const secret = textEncoder.encode(e.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const roles = payload.roles;
    const scope = typeof payload.scope === "string" ? payload.scope : "";
    if (!sub || !Array.isArray(roles)) return null;
    return { sub, roles: roles as RoleCode[], scope, typ: "access" };
  } catch {
    return null;
  }
}

export function createRefreshTokenValue() {
  return randomBytes(48).toString("hex");
}

export function hashRefreshToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
