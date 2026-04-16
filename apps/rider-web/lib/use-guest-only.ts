"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth-store";

/**
 * Redirects authenticated riders away from guest-only pages.
 * Returns true while checking/redirecting (caller should render nothing).
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

  if (!checked) return true;
  return shouldRedirect;
}
