"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@fitmeals/ui";
import { getAccessToken } from "@/lib/auth-store";
import { SegoDashboard } from "@/components/sego-dashboard";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setReady(true);
  }, [router]);

  if (!ready) return <Skeleton className="m-8 h-40 w-full" />;

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900" data-testid="admin-dashboard-title">
        Dashboard
      </h1>
      <SegoDashboard />
    </div>
  );
}
