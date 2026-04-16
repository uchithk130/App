"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth-store";

/**
 * Redirects authenticated customers away from guest-only pages.
 * Returns true while checking/redirecting (caller should render nothing).
 * Uses useEffect only to avoid hydration mismatch.
 */
export function useGuestOnly(redirectTo = "/"): boolean {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      setShouldRedirect(true);
      router.replace(redirectTo);
    }
    setChecked(true);
  }, [router, redirectTo]);

  // Not yet checked on client  render nothing to avoid flash
  if (!checked) return true;
  return shouldRedirect;
}
