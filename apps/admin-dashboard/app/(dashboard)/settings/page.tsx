"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@fitmeals/ui";
import { getAccessToken } from "@/lib/auth-store";

export default function SettingsPage() {
  const router = useRouter();
  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
  }, [router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">System preferences (template shell — extend as needed)</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-base">Brand</CardTitle>
            <CardDescription>Logo, colors, and email templates</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Hook to admin settings API when available.</CardContent>
        </Card>
        <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-base">Delivery zones</CardTitle>
            <CardDescription>Pincodes, fees, tax</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Managed via database / future CRUD screens.</CardContent>
        </Card>
        <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-base">Integrations</CardTitle>
            <CardDescription>Razorpay, S3, WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Configured with environment variables in this MVP.</CardContent>
        </Card>
        <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-base">Roles & staff</CardTitle>
            <CardDescription>Admin users</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Single admin role in current auth model.</CardContent>
        </Card>
      </div>
    </div>
  );
}
