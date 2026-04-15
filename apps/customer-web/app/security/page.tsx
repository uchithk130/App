"use client";

import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";

export default function SecurityPage() {
  return (
    <KcalViewportShell>
      <div className="min-h-dvh bg-white">
        <main className="mx-auto max-w-kcal px-5 pb-10 pt-8">
          <Link
            href="/profile"
            className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-kcal-sage"
          >
            <ChevronLeft className="h-4 w-4" />
            Profile
          </Link>
          <h1 className="text-2xl font-bold text-kcal-charcoal">Security</h1>
          <p className="mt-2 text-sm text-kcal-muted">Manage your account security settings.</p>

          <section className="mt-8 space-y-4 rounded-kcal-xl border border-kcal-cream bg-kcal-cream/30 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-kcal-charcoal">Change Password</h2>
                <p className="text-xs text-kcal-muted">Update your account password</p>
              </div>
            </div>
          </section>

          <section className="mt-4 space-y-4 rounded-kcal-xl border border-kcal-cream bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-kcal-charcoal">Active Sessions</h2>
            <p className="text-sm text-kcal-muted">
              You are currently logged in on this device.
            </p>
          </section>
        </main>
      </div>
    </KcalViewportShell>
  );
}
