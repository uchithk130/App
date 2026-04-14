import { getClientCookie, setKcalOnboardedCookie, clearKcalOnboardedCookie } from "./kcal-gate-cookies";
import { KCAL_ONBOARDED_COOKIE } from "./kcal-gate-constants";

/** Primary persistence for “has completed customer onboarding” (client). */
export const CUSTOMER_ONBOARDING_COMPLETED_KEY = "customer_onboarding_completed";

const LEGACY_SESSION_KEY = "kcal_onboarded";

/** True if the user should skip the marketing onboarding flow (client-side). */
export function isCustomerOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(CUSTOMER_ONBOARDING_COMPLETED_KEY) === "true") return true;
  } catch {
    /* private mode */
  }
  if (sessionStorage.getItem(LEGACY_SESSION_KEY) === "1") return true;
  return getClientCookie(KCAL_ONBOARDED_COOKIE) === "1";
}

/** Call after the user finishes onboarding (final CTA or equivalent). Syncs cookie for middleware. */
export function markCustomerOnboardingComplete(): void {
  try {
    localStorage.setItem(CUSTOMER_ONBOARDING_COMPLETED_KEY, "true");
  } catch {
    /* ignore */
  }
  sessionStorage.setItem(LEGACY_SESSION_KEY, "1");
  setKcalOnboardedCookie();
}

/**
 * Development: clear completion so the full flow can be tested again.
 * Usage: open `/splash?resetOnboarding=1` (development builds only).
 */
export function resetCustomerOnboardingForDev(): void {
  try {
    localStorage.removeItem(CUSTOMER_ONBOARDING_COMPLETED_KEY);
  } catch {
    /* ignore */
  }
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  clearKcalOnboardedCookie();
}
