"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

export default function FinancePage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setReady(true);
  }, [router]);

  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () =>
      api<{ pendingRiderWithdrawals: number; revenueThisMonth: string; revenueToday: string }>(
        "/api/v1/admin/overview"
      ),
    enabled: ready && !!getAccessToken(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Finance</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Payouts and revenue — Metor-style finance hub</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-slate-500">Pending rider withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {overview.data?.pendingRiderWithdrawals ?? "—"}
              </span>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-slate-500">Revenue today</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold tabular-nums">
            {overview.isLoading ? <Skeleton className="h-8 w-24" /> : `₹${overview.data?.revenueToday ?? "0"}`}
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-slate-500">Revenue this month</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold tabular-nums">
            {overview.isLoading ? <Skeleton className="h-8 w-24" /> : `₹${overview.data?.revenueThisMonth ?? "0"}`}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base">Payout workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600 dark:text-zinc-400">
          <p>
            Manage rider withdrawal requests, approve payouts, and mark payments as completed.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/payouts">Open Payout Queue</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
