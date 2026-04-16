"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Flame, Trash2, ShoppingBag } from "lucide-react";
import { Skeleton } from "@fitmeals/ui";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type FavMeal = {
  mealId: string;
  name: string;
  slug: string;
  basePrice: string;
  compareAtPrice: string | null;
  coverUrl: string | null;
  calories: number | null;
  proteinG: string | null;
  favoritedAt: string;
};

function fmtPrice(s: string) {
  return `\u20B9${Math.round(Number(s))}`;
}

export default function FavoritesPage() {
  const qc = useQueryClient();
  const authed = typeof window !== "undefined" && !!getAccessToken();

  const favsQ = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api<{ items: FavMeal[] }>("/api/v1/favorites"),
    enabled: authed,
  });

  const removeFav = useMutation({
    mutationFn: (mealId: string) =>
      api(`/api/v1/favorites/${mealId}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const items = favsQ.data?.items ?? [];

  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <div className="relative min-h-dvh bg-white">
          <main className="mx-auto max-w-kcal px-5 pb-6 pt-10 max-lg:kcal-safe-pb lg:max-w-3xl lg:px-10 lg:pb-12 lg:pt-12">
            <h1 className="mb-2 text-xl font-bold text-kcal-charcoal">Favorites</h1>
            <p className="mb-8 text-sm text-kcal-muted">Meals you love, one tap away.</p>

            {!authed ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 px-6 py-14 text-center">
                <Heart className="mb-4 h-12 w-12 text-rose-300" strokeWidth={1.5} />
                <p className="mb-6 text-sm text-kcal-muted">Log in to see your favorites.</p>
                <Link href="/login" className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-sm">
                  Log in
                </Link>
              </div>
            ) : favsQ.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 px-6 py-14 text-center">
                <Heart className="mb-4 h-12 w-12 text-rose-300" strokeWidth={1.5} />
                <p className="mb-6 text-sm text-kcal-muted">No favorites yet. Browse meals and tap the heart to save them here.</p>
                <Link href="/menu" className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-sm">
                  Browse meals
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((fav) => (
                  <div
                    key={fav.mealId}
                    className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
                  >
                    <Link href={`/meals/${fav.slug}`} className="block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                      {fav.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fav.coverUrl} alt={fav.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-slate-200" />
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/meals/${fav.slug}`}>
                        <p className="truncate text-sm font-semibold text-slate-900">{fav.name}</p>
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        {fav.calories != null && (
                          <span className="flex items-center gap-0.5">
                            <Flame className="h-3 w-3 text-orange-400" />
                            {fav.calories} kcal
                          </span>
                        )}
                        {fav.proteinG != null && (
                          <span className="font-medium text-emerald-600">{Math.round(Number(fav.proteinG))}g protein</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-900">{fmtPrice(fav.basePrice)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFav.mutate(fav.mealId)}
                      disabled={removeFav.isPending}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-rose-400 transition hover:bg-rose-50 disabled:opacity-40"
                      aria-label="Remove from favorites"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </KcalAppLayout>
    </KcalViewportShell>
  );
}
