"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth-store";

/**
 * Redirects authenticated riders away from guest-only pages (login, register, etc.).
 * Returns true while redirecting (caller should render nothing).
 */
export function useGuestOnly(redirectTo = "/"): boolean {
  const router = useRouter();
  const token = typeof window !== "undefined" ? getAccessToken() : null;

  useEffect(() => {
    if (getAccessToken()) {
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);

  return !!token;
}
