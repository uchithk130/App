"use client";

import Link from "next/link";
import { ChevronLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";

export default function InvitePage() {
  const [copied, setCopied] = useState(false);
  const referralCode = "FITMEALS2026";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <h1 className="text-2xl font-bold text-kcal-charcoal">Invite Friends</h1>
          <p className="mt-2 text-sm text-kcal-muted">Share FitMeals and earn rewards together.</p>

          <section className="mt-8 space-y-4 rounded-kcal-xl border border-kcal-cream bg-kcal-cream/30 p-5 text-center">
            <h2 className="text-lg font-bold text-kcal-charcoal">Your Referral Code</h2>
            <div className="flex items-center justify-center gap-3">
              <span className="rounded-xl bg-white px-6 py-3 text-lg font-bold tracking-widest text-kcal-charcoal shadow-sm ring-1 ring-slate-200">
                {referralCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                aria-label="Copy code"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-sm text-kcal-muted">
              Share this code with friends. You both get rewards when they place their first order!
            </p>
          </section>
        </main>
      </div>
    </KcalViewportShell>
  );
}
