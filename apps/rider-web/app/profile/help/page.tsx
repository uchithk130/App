"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, HelpCircle, MessageCircle, Mail } from "lucide-react";
import { getAccessToken } from "@/lib/auth-store";

export default function RiderHelpCenterPage() {
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
        <h1 className="text-xl font-bold text-slate-900">Help Center</h1>
        <p className="mt-1 text-sm text-slate-500">Get help with your rider account</p>
      </div>

      <div className="mx-5 space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Frequently Asked Questions</h2>
          <div className="space-y-3">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between text-sm text-slate-700">
                How do I go online to receive orders?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Toggle the availability switch on the home screen to go online. You must have an approved account and a completed profile.
              </p>
            </details>
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between text-sm text-slate-700">
                How do I withdraw my earnings?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Go to Wallet, tap Withdraw, and enter the amount. You need a verified and approved bank account to request a withdrawal.
              </p>
            </details>
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between text-sm text-slate-700">
                How do I update my bank details?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Go to Profile &gt; Bank Details. If you already have approved details, changes will require admin review before activation.
              </p>
            </details>
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between text-sm text-slate-700">
                Why is my profile edit pending?
                <span className="text-slate-400 group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                After your initial profile is approved, any changes require admin review. You can track your requests under Profile &gt; Edit Requests.
              </p>
            </details>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Contact Support</h2>
          <div className="space-y-3">
            <a href="mailto:rider-support@fitmeals.dev" className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 transition hover:bg-amber-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Email Support</p>
                <p className="text-xs text-slate-500">rider-support@fitmeals.dev</p>
              </div>
            </a>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Live Chat</p>
                <p className="text-xs text-slate-500">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
