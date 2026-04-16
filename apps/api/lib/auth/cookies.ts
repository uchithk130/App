import { cookies } from "next/headers";
import { env } from "../env";

export const REFRESH_COOKIE = "fitmeals_refresh";

/** App-scoped cookie names to prevent cross-app token contamination */
const SCOPED_COOKIES: Record<string, string> = {
  customer: "fitmeals_refresh_customer",
  admin: "fitmeals_refresh_admin",
  rider: "fitmeals_refresh_rider",
};

export function cookieNameForApp(app?: string): string {
  return (app && SCOPED_COOKIES[app]) || REFRESH_COOKIE;
}

export async function setRefreshCookie(token: string, maxAgeSeconds: number, app?: string) {
  const e = env();
  const store = await cookies();
  const name = cookieNameForApp(app);
  store.set(name, token, {
    httpOnly: true,
    secure: e.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
    domain: e.AUTH_COOKIE_DOMAIN || undefined,
  });
}

export async function clearRefreshCookie(app?: string) {
  const e = env();
  const store = await cookies();
  const name = cookieNameForApp(app);
  store.set(name, "", {
    httpOnly: true,
    secure: e.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    domain: e.AUTH_COOKIE_DOMAIN || undefined,
  });
}

export async function getRefreshCookie(app?: string) {
  const store = await cookies();
  if (app) {
    const name = cookieNameForApp(app);
    return store.get(name)?.value ?? null;
  }
  // Fallback: check all scoped cookies, then legacy
  for (const name of Object.values(SCOPED_COOKIES)) {
    const val = store.get(name)?.value;
    if (val) return val;
  }
  return store.get(REFRESH_COOKIE)?.value ?? null;
}
