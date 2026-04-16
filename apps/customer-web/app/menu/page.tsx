"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search,
  X,
  Flame,
  Heart,
  Plus,
  Minus,
  Star,
  ShoppingBag,
  Leaf,
  UtensilsCrossed,
} from "lucide-react";
import { Skeleton } from "@fitmeals/ui";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { API_BASE } from "@/lib/config";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

/* ?? Types ?? */

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

type CartItem = { id: string; quantity: number; meal: { id: string } };
type Cart = { id: string; items: CartItem[] };

/* ?? Helpers ?? */

function fmtPrice(s: string) {
  return `\u20B9${Math.round(Number(s))}`;
}

/* ?? Meal Card ?? */

function MealCardItem({
  meal,
  cartQty,
  onAdd,
  onUpdate,
  onRemove,
  busy,
  isFav,
  onToggleFav,
}: {
  meal: MealCard;
  cartQty: number;
  onAdd: () => void;
  onUpdate: (qty: number) => void;
  onRemove: () => void;
  busy: boolean;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const hasDiscount =
    meal.compareAtPrice && Number(meal.compareAtPrice) > Number(meal.basePrice);
  const discountPct = hasDiscount
    ? Math.round((1 - Number(meal.basePrice) / Number(meal.compareAtPrice!)) * 100)
    : 0;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
      {/* Image  fixed aspect ratio */}
      <Link href={`/meals/${meal.slug}`} className="relative block w-full">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
          {meal.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meal.coverUrl}
              alt={meal.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UtensilsCrossed className="h-8 w-8 text-slate-200" />
            </div>
          )}

          {/* Badges  inside overflow-hidden container so they stay within card bounds */}
          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
            {meal.richInProtein && (
              <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                High Protein
              </span>
            )}
            {meal.richInLowCarb && (
              <span className="rounded-full bg-sky-600/90 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                Low Carb
              </span>
            )}
          </div>

          {/* Heart + Discount at top-right */}
          <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(); }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition hover:bg-white active:scale-90"
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={`h-3.5 w-3.5 transition-colors ${
                  isFav ? "fill-rose-500 text-rose-500" : "text-slate-400"
                }`}
              />
            </button>
            {discountPct > 0 && (
              <span className="rounded-full bg-rose-500/90 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                {discountPct}% OFF
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Content  fixed height structure */}
      <div className="flex flex-1 flex-col p-3">
        {/* Title  exactly 2 lines reserved */}
        <Link href={`/meals/${meal.slug}`}>
          <h3 className="line-clamp-2 h-[2.5rem] text-[13px] font-semibold leading-[1.25rem] text-slate-900">
            {meal.name}
          </h3>
        </Link>

        {/* Nutrition */}
        <div className="mt-1.5 flex items-center gap-2 text-[10px]">
          {meal.nutrition ? (
            <>
              <span className="flex items-center gap-0.5 font-semibold text-slate-500">
                <Flame className="h-3 w-3 text-orange-400" />
                {meal.nutrition.calories}
              </span>
              <span className="font-semibold text-emerald-600">
                {Math.round(Number(meal.nutrition.proteinG))}g protein
              </span>
            </>
          ) : (
            <span className="text-slate-300">&mdash;</span>
          )}
        </div>

        {/* Rating */}
        <div className="mt-1 h-4">
          {meal.ratingAvg != null && meal.ratingCount > 0 ? (
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium text-slate-600">
                {meal.ratingAvg.toFixed(1)}
              </span>
              <span>({meal.ratingCount})</span>
            </div>
          ) : null}
        </div>

        {/* Price + Cart CTA  always bottom aligned */}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">
              {fmtPrice(meal.basePrice)}
            </p>
            {hasDiscount && (
              <p className="text-[10px] text-slate-400 line-through">
                {fmtPrice(meal.compareAtPrice!)}
              </p>
            )}
          </div>

          {cartQty > 0 ? (
            <div className="flex items-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  cartQty <= 1 ? onRemove() : onUpdate(cartQty - 1);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <span className="min-w-[1.25rem] text-center text-xs font-bold tabular-nums text-emerald-800">
                {cartQty}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdate(cartQty + 1);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAdd();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ?? Category Rail (admin-driven only) ?? */

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
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
      {/* "All" is a frontend convenience  not a fake admin category */}
      <button
        type="button"
        onClick={() => onSelect("")}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
          !selected
            ? "bg-emerald-500 text-white shadow-sm"
            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.slug)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
            selected === cat.slug
              ? "bg-emerald-500 text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          {cat.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cat.iconUrl}
              alt=""
              className="h-4 w-4 rounded-full object-cover"
            />
          ) : (
            <Leaf className="h-3.5 w-3.5 opacity-50" />
          )}
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}

/* ?? Skeletons ?? */

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
        <div className="flex items-end justify-between pt-1">
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="flex gap-2 px-4 pb-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
      ))}
    </div>
  );
}

/* ?? Main Page ?? */

function MenuPageContent() {
  const qc = useQueryClient();
  const sp = useSearchParams();
  const [categorySlug, setCategorySlug] = React.useState(
    sp.get("category") ?? ""
  );
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const authed = typeof window !== "undefined" && !!getAccessToken();

  /* Cart */
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
    mutationFn: (mealId: string) =>
      api("/api/v1/cart/items", {
        method: "POST",
        body: JSON.stringify({ mealId, quantity: 1 }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const updateQty = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api(`/api/v1/cart/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const removeItem = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/cart/items/${id}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });
  const cartBusy =
    addToCart.isPending || updateQty.isPending || removeItem.isPending;

  /* Favorites */
  type FavItem = { mealId: string };
  const favsQ = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api<{ items: FavItem[] }>("/api/v1/favorites"),
    enabled: authed,
  });
  const favSet = React.useMemo(() => {
    const s = new Set<string>();
    for (const f of favsQ.data?.items ?? []) s.add(f.mealId);
    return s;
  }, [favsQ.data]);
  const addFav = useMutation({
    mutationFn: (mealId: string) =>
      api("/api/v1/favorites", { method: "POST", body: JSON.stringify({ mealId }) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
  const removeFav = useMutation({
    mutationFn: (mealId: string) =>
      api(`/api/v1/favorites/${mealId}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["favorites"] }),
  });

  /* Debounced search */
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  /* Categories  admin-driven */
  const categoriesQ = useQuery({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/categories`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Category[] };
    },
  });

  /* Meals */
  const params = new URLSearchParams();
  params.set("limit", "60");
  if (categorySlug) params.set("categorySlug", categorySlug);
  if (debouncedSearch.length >= 2) params.set("q", debouncedSearch);

  const mealsQ = useQuery({
    queryKey: ["menu-meals", categorySlug, debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/meals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as {
        items: MealCard[];
        nextCursor: string | null;
      };
    },
  });

  const categories = categoriesQ.data?.items ?? [];
  const meals = mealsQ.data?.items ?? [];

  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <div className="relative z-10 flex min-h-dvh flex-col bg-[#f7f8f7]">
          {/* ?? Header ?? */}
          <header className="sticky top-0 z-30 bg-white/95 shadow-sm backdrop-blur-md">
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
                    onClick={() => {
                      setSearch("");
                      setSearchOpen(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="flex-1 text-lg font-bold text-slate-900">
                    Menu
                  </h1>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5 text-slate-600" />
                  </button>
                  <Link
                    href="/cart"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                  >
                    <ShoppingBag className="h-5 w-5 text-slate-600" />
                    {cartTotal > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white shadow-sm">
                        {cartTotal}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </div>

            {/* ?? Category chips  admin-driven only ?? */}
            <div className="border-b border-slate-100">
              {categoriesQ.isLoading ? (
                <CategorySkeleton />
              ) : (
                <CategoryRail
                  categories={categories}
                  selected={categorySlug}
                  onSelect={setCategorySlug}
                />
              )}
            </div>
          </header>

          {/* ?? Meal Grid ?? */}
          <main className="mx-auto w-full max-w-2xl flex-1 px-3 pb-6 pt-5 max-lg:kcal-safe-pb lg:max-w-6xl lg:px-6 lg:pt-6">
            {mealsQ.isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : meals.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                  <UtensilsCrossed className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  No meals found
                </p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                  {debouncedSearch
                    ? "Try a different search term"
                    : "Try selecting a different category"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {meals.map((m) => {
                  const ci = cartByMeal.get(m.id);
                  return (
                    <MealCardItem
                      key={m.id}
                      meal={m}
                      cartQty={ci?.quantity ?? 0}
                      onAdd={() => addToCart.mutate(m.id)}
                      onUpdate={(qty) =>
                        ci && updateQty.mutate({ id: ci.id, quantity: qty })
                      }
                      onRemove={() => ci && removeItem.mutate(ci.id)}
                      busy={cartBusy}
                      isFav={favSet.has(m.id)}
                      onToggleFav={() => {
                        if (!authed) return;
                        favSet.has(m.id) ? removeFav.mutate(m.id) : addFav.mutate(m.id);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </main>
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
