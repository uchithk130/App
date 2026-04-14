"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  X,
  Flame,
  Leaf,
  Plus,
  Minus,
  Star,
  ShoppingBag,
} from "lucide-react";
import { Skeleton } from "@fitmeals/ui";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { API_BASE } from "@/lib/config";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

/* ---- Types ---- */

type Category = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
};

type MealCard = {
  id: string;
  name: string;
  slug: string;
  mealType: string;
  basePrice: string;
  compareAtPrice: string | null;
  richInProtein: boolean;
  richInFiber: boolean;
  richInLowCarb: boolean;
  category: { name: string; slug: string };
  nutrition: {
    calories: number;
    proteinG: string;
    carbG: string;
    fatG: string;
    fiberG: string;
  } | null;
  coverUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number;
};

/* ---- Helpers ---- */

function fmtPrice(s: string) {
  return `\u20B9${Math.round(Number(s))}`;
}

const QUICK_FILTERS = [
  { key: "all", label: "All" },
  { key: "highProtein", label: "High Protein" },
  { key: "lowCarb", label: "Low Carb" },
  { key: "offers", label: "Offers" },
  { key: "veg", label: "Veg" },
] as const;

type QuickFilter = (typeof QUICK_FILTERS)[number]["key"];

/* ---- Compact Meal Card ---- */

function CompactMealCard({ meal, cartQty, onAdd, onUpdate, onRemove, busy }: {
  meal: MealCard;
  cartQty: number;
  onAdd: () => void;
  onUpdate: (qty: number) => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const hasDiscount = meal.compareAtPrice && Number(meal.compareAtPrice) > Number(meal.basePrice);
  const discountPct = hasDiscount
    ? Math.round((1 - Number(meal.basePrice) / Number(meal.compareAtPrice!)) * 100)
    : 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
      {/* Image - navigates to detail */}
      <Link href={`/meals/${meal.slug}`} className="relative aspect-[4/3] w-full bg-slate-100">
        {meal.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={meal.coverUrl}
            alt={meal.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <ShoppingBag className="h-8 w-8" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
          {meal.richInProtein && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
              High Protein
            </span>
          )}
          {meal.richInLowCarb && (
            <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
              Low Carb
            </span>
          )}
        </div>

        {discountPct > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
            {discountPct}% OFF
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-2.5">
        <Link href={`/meals/${meal.slug}`}>
          <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-slate-800">
            {meal.name}
          </p>
        </Link>

        {/* Nutrition row */}
        {meal.nutrition && (
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-0.5 font-medium">
              <Flame className="h-3 w-3 text-orange-400" />
              {meal.nutrition.calories} kcal
            </span>
            <span className="font-medium text-emerald-600">
              {Math.round(Number(meal.nutrition.proteinG))}g protein
            </span>
          </div>
        )}

        {/* Rating */}
        {meal.ratingAvg != null && meal.ratingCount > 0 && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-slate-600">{meal.ratingAvg}</span>
            <span>({meal.ratingCount})</span>
          </div>
        )}

        {/* Price + Add / Qty stepper */}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-sm font-bold text-slate-900">{fmtPrice(meal.basePrice)}</p>
            {hasDiscount && (
              <p className="text-[10px] text-slate-400 line-through">{fmtPrice(meal.compareAtPrice!)}</p>
            )}
          </div>
          {cartQty > 0 ? (
            <div className="flex items-center gap-0 rounded-full bg-emerald-50 ring-1 ring-emerald-200">
              <button
                type="button"
                disabled={busy}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); cartQty <= 1 ? onRemove() : onUpdate(cartQty - 1); }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <span className="min-w-[1.25rem] text-center text-xs font-bold tabular-nums text-emerald-800">{cartQty}</span>
              <button
                type="button"
                disabled={busy}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdate(cartQty + 1); }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Category Rail ---- */

function CategoryRail({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:flex-col lg:overflow-x-visible lg:pb-0">
      <button
        type="button"
        onClick={() => onSelect("")}
        className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition lg:w-full ${
          !selected
            ? "bg-emerald-500 text-white shadow-sm"
            : "bg-white text-slate-600 ring-1 ring-slate-100 hover:bg-slate-50"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.slug)}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition lg:w-full ${
            selected === cat.slug
              ? "bg-emerald-500 text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-100 hover:bg-slate-50"
          }`}
        >
          {cat.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cat.iconUrl} alt="" className="h-5 w-5 rounded-md object-cover" />
          ) : (
            <Leaf className="h-4 w-4 opacity-60" />
          )}
          <span className="truncate">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}

/* ---- Main Page ---- */

type CartItem = { id: string; quantity: number; meal: { id: string } };
type Cart = { id: string; items: CartItem[] };

function MenuPageContent() {
const qc = useQueryClient();
const [search, setSearch] = React.useState("");
const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const sp = useSearchParams();
  const [categorySlug, setCategorySlug] = React.useState(sp.get("category") ?? "");
  const [quickFilter, setQuickFilter] = React.useState<QuickFilter>("all");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const authed = typeof window !== "undefined" && !!getAccessToken();

  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: () => api<Cart>("/api/v1/cart"),
    enabled: authed,
  });

  const cartItems = cart.data?.items ?? [];
  const cartTotal = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartByMeal = React.useMemo(() => {
    const map = new Map<string, CartItem>();
    for (const ci of cartItems) map.set(ci.meal.id, ci);
    return map;
  }, [cartItems]);

  const addToCart = useMutation({
    mutationFn: (mealId: string) => api("/api/v1/cart/items", { method: "POST", body: JSON.stringify({ mealId, quantity: 1 }) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const updateQty = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api(`/api/v1/cart/items/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const removeItem = useMutation({
    mutationFn: (id: string) => api(`/api/v1/cart/items/${id}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const cartBusy = addToCart.isPending || updateQty.isPending || removeItem.isPending;

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const categoriesQ = useQuery({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/categories`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Category[] };
    },
  });

  // Build query params
  const params = new URLSearchParams();
  params.set("limit", "60");
  if (categorySlug) params.set("categorySlug", categorySlug);
  if (debouncedSearch.length >= 2) params.set("q", debouncedSearch);
  if (quickFilter === "highProtein") params.set("minProtein", "25");
  if (quickFilter === "offers") params.set("offersOnly", "1");

  const mealsQ = useQuery({
    queryKey: ["menu-meals", categorySlug, debouncedSearch, quickFilter],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/meals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: MealCard[]; nextCursor: string | null };
    },
  });

  const categories = categoriesQ.data?.items ?? [];
  let meals = mealsQ.data?.items ?? [];

  // Client-side quick filters
  if (quickFilter === "lowCarb") meals = meals.filter((m) => m.richInLowCarb);
  if (quickFilter === "veg") meals = meals.filter((m) => m.mealType !== "NON_VEG");

  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <div className="relative z-10 flex min-h-dvh flex-col bg-[#f7f8f7]">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-md">
            <div className="flex items-center gap-2 px-4 py-3">
              <Link
                href="/"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-slate-100"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-slate-800" />
              </Link>

              {searchOpen ? (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search meals..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setSearchOpen(false); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="flex-1 text-base font-bold text-slate-900">Menu</h1>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                  >
                    <Search className="h-5 w-5 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                  >
                    <SlidersHorizontal className="h-5 w-5 text-slate-600" />
                  </button>
                  <Link
                    href="/cart"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                  >
                    <ShoppingBag className="h-5 w-5 text-slate-600" />
                    {cartTotal > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white shadow-sm">
                        {cartTotal}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </div>

            {/* Quick filters */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setQuickFilter(f.key)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    quickFilter === f.key
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </header>

          {/* Body */}
          <div className="mx-auto w-full max-w-6xl flex-1 px-3 pb-6 pt-3 max-lg:kcal-safe-pb lg:flex lg:gap-5 lg:px-6 lg:pt-5">
            {/* Left category rail (desktop sidebar, mobile horizontal) */}
            <div className="mb-3 lg:mb-0 lg:w-44 lg:shrink-0">
              {categoriesQ.isLoading ? (
                <div className="flex gap-2 lg:flex-col">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-xl lg:w-full" />
                  ))}
                </div>
              ) : (
                <CategoryRail
                  categories={categories}
                  selected={categorySlug}
                  onSelect={(s) => setCategorySlug(s)}
                />
              )}
            </div>

            {/* Meal grid */}
            <div className="flex-1">
              {mealsQ.isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
                  ))}
                </div>
              ) : meals.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center">
                  <ShoppingBag className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No meals found</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {debouncedSearch ? "Try a different search term" : "Try selecting a different category or filter"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {meals.map((m) => {
                    const ci = cartByMeal.get(m.id);
                    return (
                      <CompactMealCard
                        key={m.id}
                        meal={m}
                        cartQty={ci?.quantity ?? 0}
                        onAdd={() => addToCart.mutate(m.id)}
                        onUpdate={(qty) => ci && updateQty.mutate({ id: ci.id, quantity: qty })}
                        onRemove={() => ci && removeItem.mutate(ci.id)}
                        busy={cartBusy}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </KcalAppLayout>
    </KcalViewportShell>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={null}>
      <MenuPageContent />
    </Suspense>
  );
}
