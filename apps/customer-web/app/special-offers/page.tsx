"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, Search, SlidersHorizontal, Star } from "lucide-react";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { API_BASE } from "@/lib/config";

type Meal = {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  compareAtPrice: string | null;
  coverUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  promoLabel: string | null;
};

function formatInr(n: string) {
  const v = Number.parseFloat(n);
  if (Number.isNaN(v)) return n;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

async function fetchOffers(q: string): Promise<{ items: Meal[] }> {
  const sp = new URLSearchParams({ limit: "40", specialOffers: "1" });
  if (q.trim()) sp.set("q", q.trim());
  const res = await fetch(`${API_BASE}/api/v1/meals?${sp.toString()}`);
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<{ items: Meal[] }>;
}

export default function SpecialOffersPage() {
  const [filter, setFilter] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(filter), 300);
    return () => window.clearTimeout(t);
  }, [filter]);

  const q = useQuery({
    queryKey: ["special-offers", debounced],
    queryFn: () => fetchOffers(debounced),
  });

  const items = q.data?.items ?? [];
  const empty = !q.isLoading && items.length === 0;

  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <div className="min-h-dvh bg-white pb-28 pt-3 lg:pb-12">
          <header className="mb-4 flex items-center gap-3 px-4">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="flex-1 text-center text-lg font-bold text-slate-900">Special Offers</h1>
            <span className="w-10" />
          </header>

          <div className="mb-4 px-4">
            <div className="flex items-center gap-3 rounded-pill bg-slate-100 px-4 py-3 ring-1 ring-slate-200/60">
              <Search className="h-5 w-5 text-slate-400" aria-hidden />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <SlidersHorizontal className="h-5 w-5 text-slate-500" aria-hidden />
            </div>
          </div>

          {q.isLoading ? (
            <div className="grid grid-cols-2 gap-3 px-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : empty ? (
            <p className="py-24 text-center text-lg font-semibold text-slate-400">Not Found</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 px-4 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((m) => (
                <Link
                  key={m.id}
                  href={`/meals/${m.slug}`}
                  className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    {m.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                    <span className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-slate-100">
                      <Heart className="h-5 w-5 text-rose-500" strokeWidth={2} />
                    </span>
                    {m.promoLabel && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2.5 pb-2 pt-5">
                        <span className="text-[10px] font-extrabold uppercase leading-tight tracking-wider text-white drop-shadow-sm">
                          {m.promoLabel}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-2 text-sm font-bold text-slate-900">{m.name}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{m.ratingAvg != null ? m.ratingAvg.toFixed(1) : "—"}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-baseline gap-2">
                      {m.compareAtPrice ? (
                        <span className="text-xs text-slate-400 line-through">{formatInr(m.compareAtPrice)}</span>
                      ) : null}
                      <span className="text-sm font-bold text-emerald-700">{formatInr(m.basePrice)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </KcalAppLayout>
    </KcalViewportShell>
  );
}
