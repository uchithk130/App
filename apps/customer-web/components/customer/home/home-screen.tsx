"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Heart,
  MapPin,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { API_BASE } from "@/lib/config";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { readStoredLocation, type StoredDeliveryLocation } from "@/lib/location-storage";

type HomeFeed = {
  promos: {
    id: string;
    badge: string | null;
    headline: string;
    subline: string | null;
    imageUrl: string | null;
    mealSlug: string | null;
    gradientFrom: string;
    gradientTo: string;
  }[];
  categories: { id: string; name: string; slug: string; sortOrder: number; iconUrl: string | null }[];
  offers: {
    id: string;
    name: string;
    slug: string;
    basePrice: string;
    compareAtPrice: string | null;
    coverUrl: string | null;
    ratingAvg: number | null;
    ratingCount: number;
  }[];
};

const CATEGORY_FALLBACK = ["Salad", "Bowl", "Soup", "Wrap", "Smoothie", "Protein", "Veg", "Snack"] as const;

async function fetchHome(): Promise<HomeFeed> {
  const res = await fetch(`${API_BASE}/api/v1/home/feed`);
  if (!res.ok) throw new Error("Failed to load home");
  return res.json() as Promise<HomeFeed>;
}

function formatInr(n: string) {
  const v = Number.parseFloat(n);
  if (Number.isNaN(v)) return n;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

export function HomeScreen() {
const [mounted, setMounted] = React.useState(false);
const [carousel, setCarousel] = React.useState(0);
const feed = useQuery({ queryKey: ["home-feed"], queryFn: fetchHome });

React.useEffect(() => { setMounted(true); }, []);

const authed = mounted && !!getAccessToken();
const cart = useQuery({
  queryKey: ["cart"],
  queryFn: () => api<{ items: { quantity: number }[] }>("/api/v1/cart"),
  enabled: authed,
});
const cartCount = cart.data?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  // Fetch real addresses from API when logged in
  type Addr = {
    id: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    label: string | null;
    lat: number | null;
    lng: number | null;
    isDefault: boolean;
  };
  const addressesQ = useQuery({
    queryKey: ["customer-addresses"],
    queryFn: () => api<{ items: Addr[] }>("/api/v1/customer/addresses"),
    enabled: authed,
  });

  // Determine the display address:
  // 1. Logged in with addresses -> use default or first address from API
  // 2. Not logged in -> use localStorage (guest location)
  // 3. No address at all -> null
  const loc = React.useMemo<StoredDeliveryLocation | null>(() => {
    if (!mounted) return null;
    if (authed && addressesQ.data?.items.length) {
      const items = addressesQ.data.items;
      const picked = items.find((a) => a.isDefault) ?? items[0];
      if (picked) {
        return {
          id: picked.id,
          label: picked.label ?? "Saved",
          line1: picked.line1,
          line2: picked.line2 ?? undefined,
          city: picked.city,
          state: picked.state,
          pincode: picked.pincode,
          lat: picked.lat ?? 0,
          lng: picked.lng ?? 0,
        };
      }
    }
    // Guest or no backend addresses: fall back to localStorage
    return readStoredLocation();
  }, [mounted, authed, addressesQ.data]);

  const promos = feed.data?.promos ?? [];
  const categories = feed.data?.categories ?? [];
  const offers = feed.data?.offers ?? [];

  React.useEffect(() => {
    if (promos.length <= 1) return;
    const t = window.setInterval(() => setCarousel((c) => (c + 1) % promos.length), 5500);
    return () => window.clearInterval(t);
  }, [promos.length]);

  const hasAddress = !!loc;
  const addressLoading = authed && addressesQ.isLoading;

  const headerLabel = hasAddress
    ? loc.label
    : authed
      ? "Set delivery address"
      : "Set your delivery location";

  const headerSub = hasAddress
    ? [loc.line1, loc.city].filter(Boolean).join(" \u00B7 ")
    : authed
      ? "Tap to add your first address"
      : "Tap to choose where we deliver";

  return (
    <div className="pb-24 pt-3 lg:pb-12 lg:pt-6">
      {/* Header */}
      <header className="mb-4 flex items-start justify-between gap-3 px-4 lg:px-6">
        <Link href="/locations" className="min-w-0 flex-1 rounded-2xl py-1 transition hover:bg-white/60">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {hasAddress ? "Deliver to" : "Location"}
          </p>
          {addressLoading ? (
            <div className="mt-1 space-y-1.5">
              <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
            </div>
          ) : (
            <>
              <div className="mt-0.5 flex items-center gap-1">
                {!hasAddress && <MapPin className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />}
                <span className="truncate text-base font-bold text-slate-900">{headerLabel}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              </div>
              <p className="truncate text-xs text-slate-500">{headerSub}</p>
            </>
          )}
        </Link>
        <Link
          href="/cart"
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md shadow-slate-200/80 ring-1 ring-slate-100"
          aria-label="Cart"
        >
          <ShoppingBag className="h-5 w-5 text-slate-800" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      {/* Promo carousel */}
      <section className="mb-5 px-4 lg:px-6" aria-label="Promotions">
        {feed.isLoading ? (
          <div className="h-44 animate-pulse rounded-[1.25rem] bg-slate-200/80" />
        ) : promos.length === 0 ? (
          <div
            className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-emerald-600 to-teal-500 px-5 py-6 text-white shadow-lg"
            style={{ minHeight: "11rem" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/90">FitMeals</p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight">Nourish on your schedule</h2>
            <p className="mt-2 max-w-[14rem] text-sm text-white/90">Macro-aware meals, delivered fresh.</p>
            <Link href="/menu" className="mt-4 inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-bold backdrop-blur-sm">
              Browse menu
            </Link>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-[1.25rem] shadow-lg">
              <div
                className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const i = Math.round(el.scrollLeft / el.clientWidth);
                  setCarousel(Math.min(Math.max(i, 0), promos.length - 1));
                }}
              >
                {promos.map((p, i) => (
                  <Link
                    key={p.id}
                    href={p.mealSlug ? `/meals/${p.mealSlug}` : "/special-offers"}
                    className="relative w-full min-w-full snap-center"
                    style={{
                      background: `linear-gradient(135deg, ${p.gradientFrom}, ${p.gradientTo})`,
                    }}
                  >
                    <div className="flex min-h-[11rem] items-stretch px-5 py-5 text-white">
                      <div className="flex min-w-0 flex-1 flex-col justify-center pr-2">
                        {p.badge ? (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/90">{p.badge}</p>
                        ) : null}
                        <h2 className="mt-1 text-xl font-extrabold leading-snug sm:text-2xl">{p.headline}</h2>
                        {p.subline ? <p className="mt-2 text-sm text-white/90">{p.subline}</p> : null}
                      </div>
                      {p.imageUrl ? (
                        <div className="relative h-28 w-28 shrink-0 self-center sm:h-32 sm:w-32">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl} alt="" className="h-full w-full object-contain drop-shadow-md" />
                        </div>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-3 flex justify-center gap-1.5">
              {promos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setCarousel(i)}
                  className={`h-1.5 rounded-full transition-all ${i === carousel ? "w-6 bg-emerald-500" : "w-2 bg-slate-300"}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Search */}
      <div className="mb-5 px-4 lg:px-6">
        <Link
          href="/menu"
          className="flex items-center gap-3 rounded-[1.125rem] bg-slate-100/90 px-4 py-3.5 ring-1 ring-slate-200/60"
        >
          <Search className="h-5 w-5 text-slate-400" aria-hidden />
          <span className="flex-1 text-left text-sm text-slate-400">Search meals</span>
          <SlidersHorizontal className="h-5 w-5 text-slate-500" aria-hidden />
        </Link>
      </div>

      {/* Categories */}
      <section className="mb-6 px-4 lg:px-6" aria-labelledby="cat-head">
        <h2 id="cat-head" className="sr-only">
          Categories
        </h2>
        {feed.isLoading ? (
          <div className="grid grid-cols-4 gap-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-slate-200/80" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {categories.slice(0, 11).map((c, idx) => (
              <Link
                key={c.id}
                href={`/menu?category=${encodeURIComponent(c.slug)}`}
                className="flex flex-col items-center rounded-2xl bg-white py-3 shadow-sm shadow-slate-200/50 ring-1 ring-slate-100 transition hover:ring-emerald-200"
              >
                <div className="mb-1.5 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-emerald-50">
                  {c.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.iconUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700">{CATEGORY_FALLBACK[idx % CATEGORY_FALLBACK.length]}</span>
                  )}
                </div>
                <span className="line-clamp-2 text-center text-[10px] font-semibold leading-tight text-slate-800">{c.name}</span>
              </Link>
            ))}
            <Link
              href="/menu"
              className="flex flex-col items-center rounded-2xl bg-white py-3 shadow-sm shadow-slate-200/50 ring-1 ring-slate-100 transition hover:ring-emerald-200"
            >
              <div className="mb-1.5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                <span className="text-lg font-bold text-slate-400">···</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-600">More</span>
            </Link>
          </div>
        )}
      </section>

      {/* Special offers */}
      <section className="px-4 lg:px-6" aria-labelledby="offers-head">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="offers-head" className="text-lg font-bold text-slate-900">
            Special offers
          </h2>
          <Link href="/special-offers" className="text-sm font-semibold text-emerald-600">
            View all &gt;
          </Link>
        </div>
        {feed.isLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 w-40 shrink-0 animate-pulse rounded-2xl bg-slate-200/80" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <p className="rounded-2xl bg-white py-8 text-center text-sm text-slate-500 ring-1 ring-slate-100">
            No offers right now — explore all meals.
          </p>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pl-1 pr-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-3 lg:overflow-visible lg:pr-0">
            {offers.map((m) => (
              <Link
                key={m.id}
                href={`/meals/${m.slug}`}
                className="relative w-[42vw] max-w-[200px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-md shadow-slate-200/60 ring-1 ring-slate-100 lg:w-auto lg:max-w-none"
              >
                <div className="relative aspect-[4/3] w-full bg-slate-100">
                  {m.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <MapPin className="h-8 w-8" />
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-slate-100"
                    aria-label="Save"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Heart className="h-5 w-5 text-rose-500" strokeWidth={2} />
                  </button>
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
      </section>
    </div>
  );
}
