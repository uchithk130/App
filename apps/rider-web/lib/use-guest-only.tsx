"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth-store";

export function GuestOnly({
  redirectTo = "/",
  children,
}: {
  redirectTo?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = React.useState<"checking" | "guest" | "redirecting">("checking");

  React.useEffect(() => {
    if (getAccessToken()) {
      setState("redirecting");
      router.replace(redirectTo);
    } else {
      setState("guest");
    }
  }, [router, redirectTo]);

  if (state !== "guest") return null;
  return <>{children}</>;
}
