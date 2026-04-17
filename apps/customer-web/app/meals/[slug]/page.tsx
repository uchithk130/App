"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { MealHighlightBadges } from "@/components/kcal/meal-menu-badges";
import {
  ProductImageHero,
  ProductPriceBlock,
  ProductRatingRow,
  NutritionGrid,
  AddOnOptionList,
  StickyAddToCart,
  ProductDescription,
} from "@/components/product";
import type { AddOnGroup } from "@/components/product";

type MealDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: string;
  compareAtPrice: string | null;
  richInProtein: boolean;
  richInFiber: boolean;
  richInLowCarb: boolean;
  nutrition: {
    calories: number;
    proteinG: string;
    carbG: string;
    fatG: string;
    fiberG: string;
  } | null;
  images: { url: string }[];
  ratingAvg: number | null;
  ratingCount: number;
  ratingDistribution: Record<number, number>;
  promoLabel: string | null;
};

/* ── Placeholder add-ons (swap with API data when backend supports it) ── */
const PLACEHOLDER_ADDONS: AddOnGroup[] = [
  {
    label: "Additional Options",
    items: [
      { id: "addon-cheese", name: "Add Cheese", price: 30 },
      { id: "addon-bacon", name: "Add Bacon", price: 50 },
      { id: "addon-meat", name: "Add Meat", price: 60 },
      { id: "addon-extra-patty", name: "Extra Patty", price: 80 },
    ],
  },
];

export default function MealDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [qty, setQty] = React.useState(1);
  const [selectedAddOns, setSelectedAddOns] = React.useState<Set<string>>(new Set());
  const authed = typeof window !== "undefined" && !!getAccessToken();

  const q = useQuery({
    queryKey: ["meal", params.slug],
    queryFn: () => api<MealDetail>(`/api/v1/meals/${params.slug}`),
    enabled: !!params.slug,
  });

  type FavItem = { mealId: string };
  const favsQ = useQuery({
    queryKey: ["favorites"],
    queryFn: () => api<{ items: FavItem[] }>("/api/v1/favorites"),
    enabled: authed,
  });
  const isFav = !!q.data && (favsQ.data?.items ?? []).some((f) => f.mealId === q.data!.id);

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

  const addToCart = useMutation({
    mutationFn: ({ mealId, quantity }: { mealId: string; quantity: number }) =>
      api("/api/v1/cart/items", {
        method: "POST",
        body: JSON.stringify({ mealId, quantity }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const toggleAddOn = React.useCallback((id: string) => {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addOnTotal = React.useMemo(() => {
    let t = 0;
    for (const g of PLACEHOLDER_ADDONS) {
      for (const item of g.items) {
        if (selectedAddOns.has(item.id)) t += item.price;
      }
    }
    return t;
  }, [selectedAddOns]);

  const unitPrice = q.data ? Number(q.data.basePrice) + addOnTotal : 0;
  const totalPrice = unitPrice * qty;
  const isHtml = !!q.data?.description?.includes("<");

  return (
    <KcalViewportShell>
      <div className="relative z-10 flex min-h-dvh flex-col bg-white lg:bg-[#f7f8f7]">
        {/* ── LOADING ── */}
        {q.isLoading && (
          <div className="mx-auto w-full max-w-5xl px-4 pt-4 lg:px-8" data-testid="meal-detail-skeleton">
            <Skeleton className="aspect-[4/3.2] w-full rounded-none lg:rounded-2xl" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-7 w-3/4 rounded-lg" />
              <Skeleton className="h-5 w-1/2 rounded-lg" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {q.isError && (
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="text-destructive">{(q.error as Error).message}</p>
          </div>
        )}

        {/* ── CONTENT ── */}
        {q.data && (
          <>
            {/* Desktop: 2-column layout */}
            <div className="mx-auto w-full max-w-5xl lg:grid lg:grid-cols-[1fr_420px] lg:gap-8 lg:px-8 lg:py-8">
              {/* ── Left: Image ── */}
              <div className="lg:sticky lg:top-8 lg:self-start">
                <ProductImageHero
                  images={q.data.images}
                  alt={q.data.name}
                  isFavorite={isFav}
                  onToggleFavorite={() => {
                    if (!authed || !q.data) return;
                    isFav ? removeFav.mutate(q.data.id) : addFav.mutate(q.data.id);
                  }}
                  backHref="/menu"
                  promoLabel={q.data.promoLabel}
                />
              </div>

              {/* ── Right: Product content ── */}
              <div className="relative -mt-3 rounded-t-[1.5rem] bg-white px-5 pb-40 pt-6 lg:mt-0 lg:rounded-2xl lg:px-6 lg:pb-8 lg:pt-6 lg:shadow-sm lg:ring-1 lg:ring-slate-100">
                {/* Name */}
                <h1 className="text-xl font-bold text-kcal-charcoal lg:text-2xl">{q.data.name}</h1>

                {/* Price */}
                <div className="mt-2">
                  <ProductPriceBlock
                    basePrice={q.data.basePrice}
                    compareAtPrice={q.data.compareAtPrice}
                  />
                </div>

                {/* Rating row */}
                <div className="mt-3">
                  <ProductRatingRow
                    avg={q.data.ratingAvg}
                    count={q.data.ratingCount}
                    mealSlug={q.data.slug}
                  />
                </div>

                {/* Highlight badges */}
                {(q.data.richInProtein || q.data.richInFiber || q.data.richInLowCarb) && (
                  <div className="mt-3">
                    <MealHighlightBadges
                      richInProtein={q.data.richInProtein}
                      richInFiber={q.data.richInFiber}
                      richInLowCarb={q.data.richInLowCarb}
                    />
                  </div>
                )}

                {/* Description */}
                <div className="mt-4">
                  <ProductDescription
                    text={q.data.description}
                    isHtml={isHtml}
                  />
                </div>

                {/* Nutrition */}
                <div className="mt-5">
                  <NutritionGrid nutrition={q.data.nutrition} />
                </div>

                {/* Divider */}
                <hr className="my-5 border-slate-100" />

                {/* Add-ons */}
                <AddOnOptionList
                  groups={PLACEHOLDER_ADDONS}
                  selected={selectedAddOns}
                  onToggle={toggleAddOn}
                />
              </div>
            </div>

            {/* Sticky bottom add-to-basket */}
            <StickyAddToCart
              quantity={qty}
              onDecrement={() => setQty((v) => Math.max(1, v - 1))}
              onIncrement={() => setQty((v) => Math.min(50, v + 1))}
              totalPrice={totalPrice}
              isPending={addToCart.isPending}
              onAddToCart={async () => {
                try {
                  await addToCart.mutateAsync({ mealId: q.data.id, quantity: qty });
                  router.push("/cart");
                } catch {
                  router.push("/login");
                }
              }}
            />
          </>
        )}
      </div>
    </KcalViewportShell>
  );
}
