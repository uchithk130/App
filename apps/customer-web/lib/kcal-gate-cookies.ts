import {
  FITMEALS_CUSTOMER_LOGGED_IN_COOKIE,
  KCAL_GATE_COOKIE_MAX_AGE,
  KCAL_ONBOARDED_COOKIE,
} from "./kcal-gate-constants";

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k !== name) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

export function setKcalOnboardedCookie() {
  writeCookie(KCAL_ONBOARDED_COOKIE, "1", KCAL_GATE_COOKIE_MAX_AGE);
}

export function setCustomerLoggedInCookie() {
  writeCookie(FITMEALS_CUSTOMER_LOGGED_IN_COOKIE, "1", KCAL_GATE_COOKIE_MAX_AGE);
}

export function clearCustomerLoggedInCookie() {
  deleteCookie(FITMEALS_CUSTOMER_LOGGED_IN_COOKIE);
}

export function clearKcalOnboardedCookie() {
  deleteCookie(KCAL_ONBOARDED_COOKIE);
}

export function hasKcalGateOnClient(): boolean {
  return (
    getClientCookie(KCAL_ONBOARDED_COOKIE) === "1" ||
    getClientCookie(FITMEALS_CUSTOMER_LOGGED_IN_COOKIE) === "1"
  );
}
