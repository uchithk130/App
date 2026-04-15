"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Shield, Lock, Smartphone } from "lucide-react";
import { getAccessToken } from "@/lib/auth-store";

export default function RiderSecurityPage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setMounted(true);
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="pb-28 pt-4">
      <div className="mb-5 px-5">
        <Link href="/profile" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-amber-600">
          <ChevronLeft className="h-4 w-4" /> Profile
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Security</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account security settings</p>
      </div>

      <div className="mx-5 space-y-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Lock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Change Password</p>
              <p className="text-xs text-slate-500">Update your account password</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Active Sessions</p>
              <p className="text-xs text-slate-500">You are currently logged in on this device</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Two-Factor Authentication</p>
              <p className="text-xs text-slate-500">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
