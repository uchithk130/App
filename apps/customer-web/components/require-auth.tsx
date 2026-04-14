"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth-store";
import { Skeleton } from "@fitmeals/ui";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      setOk(false);
    } else setOk(true);
  }, [router]);
  if (ok === null) return <Skeleton className="mx-auto mt-20 h-40 max-w-xl" data-testid="auth-loading" />;
  if (!ok) return null;
  return <>{children}</>;
}
