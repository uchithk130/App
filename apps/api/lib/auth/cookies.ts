import { cookies } from "next/headers";
import { env } from "../env";

export const REFRESH_COOKIE = "fitmeals_refresh";

export async function setRefreshCookie(token: string, maxAgeSeconds: number) {
  const e = env();
  const store = await cookies();
  store.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: e.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
    domain: e.AUTH_COOKIE_DOMAIN || undefined,
  });
}

export async function clearRefreshCookie() {
  const e = env();
  const store = await cookies();
  store.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: e.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    domain: e.AUTH_COOKIE_DOMAIN || undefined,
  });
}

export async function getRefreshCookie() {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}
