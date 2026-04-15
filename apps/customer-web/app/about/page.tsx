import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";

export default function AboutPage() {
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
          <h1 className="text-2xl font-bold text-kcal-charcoal">About FitMeals</h1>
          <p className="mt-2 text-sm text-kcal-muted">Macro-perfect meals, delivered fresh.</p>

          <section className="mt-8 space-y-4 rounded-kcal-xl border border-kcal-cream bg-kcal-cream/30 p-5">
            <h2 className="text-lg font-bold text-kcal-charcoal">Our Mission</h2>
            <p className="text-sm leading-relaxed text-kcal-charcoal">
              FitMeals delivers nutritionally balanced, chef-prepared meals designed to fuel your fitness goals. Whether
              you&apos;re building muscle, cutting fat, or just eating smarter — we&apos;ve got your plate covered.
            </p>
          </section>

          <section className="mt-6 space-y-4 rounded-kcal-xl border border-kcal-cream bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-kcal-charcoal">App Info</h2>
            <ul className="space-y-2 text-sm text-kcal-muted">
              <li><span className="font-medium text-kcal-charcoal">Version:</span> 1.0.0</li>
              <li><span className="font-medium text-kcal-charcoal">Build:</span> 2026.04</li>
            </ul>
          </section>

          <p className="mt-8 text-center text-xs text-kcal-muted">
            Made with ?? by the FitMeals team
          </p>
        </main>
      </div>
    </KcalViewportShell>
  );
}
