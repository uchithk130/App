"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { AdminMealCover } from "@/components/admin-meal-cover";

type MealRow = {
  id: string;
  name: string;
  slug: string;
  mealType: string;
  basePrice: string;
  compareAtPrice: string | null;
  listingStatus: "ACTIVE" | "INACTIVE" | "PAUSED";
  coverUrl: string | null;
  category: { name: string };
  isSpecialOffer: boolean;
  promoLabel: string | null;
};

const STATUS_BTN =
  "rounded-full px-3 py-1 text-xs font-bold transition ring-1 ring-transparent";

export default function AdminMealsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setReady(true);
  }, [router]);

  const meals = useQuery({
    queryKey: ["admin-meals-list"],
    queryFn: () => api<{ items: MealRow[] }>("/api/v1/admin/meals?limit=80"),
    enabled: ready && !!getAccessToken(),
  });

  const patchStatus = useMutation({
    mutationFn: async ({ id, listingStatus }: { id: string; listingStatus: MealRow["listingStatus"] }) => {
      await api(`/api/v1/admin/meals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ listingStatus }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-meals-list"] }),
  });

  const toggleOffer = useMutation({
    mutationFn: async ({ id, isSpecialOffer }: { id: string; isSpecialOffer: boolean }) => {
      await api(`/api/v1/admin/meals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isSpecialOffer }),
      });
    },
    onMutate: async ({ id, isSpecialOffer }) => {
      await qc.cancelQueries({ queryKey: ["admin-meals-list"] });
      const prev = qc.getQueryData<{ items: MealRow[] }>(["admin-meals-list"]);
      if (prev) {
        qc.setQueryData<{ items: MealRow[] }>(["admin-meals-list"], {
          ...prev,
          items: prev.items.map((m) => m.id === id ? { ...m, isSpecialOffer } : m),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin-meals-list"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin-meals-list"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meals</h1>
          <p className="text-sm text-slate-500">Grid view — set active, paused, or inactive</p>
        </div>
        <Button
          asChild
          className="rounded-full bg-gradient-to-r from-admin-orange to-amber-500 font-semibold text-white shadow-lg shadow-orange-200/40"
        >
          <Link href="/meals/new">+ Add meal</Link>
        </Button>
      </div>

      {meals.isLoading ? <p className="text-slate-500">Loading…</p> : null}
      {meals.isError ? <p className="text-red-600">{(meals.error as Error).message}</p> : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {meals.data?.items.map((m) => (
          <div
            key={m.id}
            className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
          >
            <AdminMealCover coverUrl={m.coverUrl} alt={m.name} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 font-bold text-slate-900">{m.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{m.category.name}</div>
                </div>
                {m.isSpecialOffer && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    OFFER
                  </span>
                )}
              </div>
              {m.promoLabel && (
                <div className="mt-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 px-2 py-1 text-[10px] font-bold text-white">
                  {m.promoLabel}
                </div>
              )}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold text-admin-orange">₹{m.basePrice}</span>
                {m.compareAtPrice && Number(m.compareAtPrice) > Number(m.basePrice) && (
                  <span className="text-xs text-slate-400 line-through">₹{m.compareAtPrice}</span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-full border-admin-orange text-admin-orange hover:bg-orange-50"
                >
                  <Link href={`/meals/${m.id}/edit`}>Edit</Link>
                </Button>
                <button
                  type="button"
                  disabled={toggleOffer.isPending}
                  onClick={() => toggleOffer.mutate({ id: m.id, isSpecialOffer: !m.isSpecialOffer })}
                  className={`${STATUS_BTN} ${
                    m.isSpecialOffer
                      ? "bg-amber-500 text-white ring-amber-600"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {m.isSpecialOffer ? "Offer ✓" : "Offer"}
                </button>
                {(["ACTIVE", "PAUSED", "INACTIVE"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={patchStatus.isPending}
                    onClick={() => patchStatus.mutate({ id: m.id, listingStatus: s })}
                    className={`${STATUS_BTN} ${
                      m.listingStatus === s
                        ? s === "ACTIVE"
                          ? "bg-emerald-500 text-white ring-emerald-600"
                          : s === "PAUSED"
                            ? "bg-amber-400 text-slate-900 ring-amber-500"
                            : "bg-slate-600 text-white ring-slate-700"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {s === "ACTIVE" ? "Active" : s === "PAUSED" ? "Paused" : "Off"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
