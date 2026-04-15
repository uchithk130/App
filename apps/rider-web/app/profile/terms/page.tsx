"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAccessToken } from "@/lib/auth-store";

export default function RiderTermsPrivacyPage() {
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
        <h1 className="text-xl font-bold text-slate-900">Terms &amp; Privacy</h1>
        <p className="mt-1 text-sm text-slate-500">How we run FitMeals Rider and handle your data</p>
      </div>

      <div className="mx-5 space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Terms of Service</h2>
          <div className="space-y-3 text-xs leading-relaxed text-slate-600">
            <p>
              By using the FitMeals Rider app you agree to deliver orders in good faith, maintain accurate profile and bank details, and follow all applicable traffic and food-safety regulations during deliveries.
            </p>
            <ul className="list-inside list-disc space-y-1 text-slate-500">
              <li>Delivery fees and incentives can change with notice in the app.</li>
              <li>Your rider account may be suspended for repeated policy violations.</li>
              <li>Withdrawal payouts are processed only to verified and approved bank accounts.</li>
              <li>Profile and bank detail changes require admin approval after initial setup.</li>
            </ul>
            <p className="text-slate-500">
              We may update these terms from time to time. Continued use of the app means you accept the changes.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Privacy Policy</h2>
          <div className="space-y-3 text-xs leading-relaxed text-slate-600">
            <p>
              We collect account, location, and delivery data to operate the rider platform. Your location is tracked only while you have active deliveries or are online.
            </p>
            <p>
              Bank account details are encrypted and stored securely. We do not share your financial information with third parties except as required for payout processing.
            </p>
            <p className="text-slate-500">
              You can request data access or account deletion through rider support. Replace this copy with your legal team&apos;s final version when ready.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Questions?{" "}
          <a href="mailto:rider-support@fitmeals.dev" className="font-semibold text-amber-600">
            rider-support@fitmeals.dev
          </a>
        </p>
      </div>
    </div>
  );
}
