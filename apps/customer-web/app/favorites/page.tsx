"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";

export default function FavoritesPage() {
  return (
    <KcalViewportShell>
    <KcalAppLayout>
    <div className="relative min-h-dvh bg-white">
      <main className="mx-auto max-w-kcal px-5 pb-6 pt-10 max-lg:kcal-safe-pb lg:max-w-3xl lg:px-10 lg:pb-12 lg:pt-12">
        <h1 className="mb-2 text-center text-xl font-bold text-kcal-charcoal lg:text-left">Favorites</h1>
        <p className="mb-10 text-center text-sm text-kcal-muted lg:text-left">Meals you love, one tap away.</p>
        <div className="flex flex-col items-center rounded-kcal-lg border border-dashed border-kcal-coral-muted bg-kcal-cream/50 px-6 py-14 text-center">
          <Heart className="mb-4 h-12 w-12 text-kcal-coral opacity-80" strokeWidth={1.5} />
          <p className="mb-6 text-sm text-kcal-muted">No favorites yet. Browse meals and tap the heart when we add it.</p>
          <Link
            href="/menu"
            className="rounded-pill bg-kcal-sage px-6 py-3 text-sm font-bold text-white shadow-kcal"
          >
            Browse meals
          </Link>
        </div>
      </main>
    </div>
    </KcalAppLayout>
    </KcalViewportShell>
  );
}
