import { clearCustomerLoggedInCookie, setCustomerLoggedInCookie } from "./kcal-gate-cookies";

const ACCESS = "fitmeals_customer_access";
const REFRESH = "fitmeals_customer_refresh";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH);
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS, access);
  if (refresh) localStorage.setItem(REFRESH, refresh);
  setCustomerLoggedInCookie();
}

export function clearTokens() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  clearCustomerLoggedInCookie();
}
