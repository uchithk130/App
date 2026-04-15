import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-bold text-kcal-charcoal">Privacy Policy</h1>
          <p className="mt-2 text-sm text-kcal-muted">Last updated: April 2026</p>

          <section className="mt-8 space-y-4 rounded-kcal-xl border border-kcal-cream bg-kcal-cream/30 p-5">
            <h2 className="text-lg font-bold text-kcal-charcoal">Your Data</h2>
            <p className="text-sm leading-relaxed text-kcal-charcoal">
              We collect account and order data to prepare and deliver your meals. Payment details are handled by our
              payment partners; we do not store full card numbers on our servers.
            </p>
            <p className="text-sm leading-relaxed text-kcal-muted">
              You can request account or data questions through support. Replace this copy with your legal team&apos;s
              final version when ready.
            </p>
          </section>

          <p className="mt-8 text-center text-xs text-kcal-muted">
            Questions?{" "}
            <a href="mailto:support@fitmeals.dev" className="font-semibold text-kcal-sage">
              support@fitmeals.dev
            </a>
          </p>
        </main>
      </div>
    </KcalViewportShell>
  );
}
