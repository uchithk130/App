"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Button, Skeleton } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { AdminMealCover } from "@/components/admin-meal-cover";

type Meal = {
  id: string;
  name: string;
  mealType: string;
  basePrice: string;
  coverUrl: string | null;
  category: { id: string; name: string };
  nutrition: { calories: number } | null;
};

type Overview = {
  popularMeals: { mealId: string; name: string; quantity: number }[];
  revenueByMonth: { month: string; revenue: number }[];
};

const ACCENT = "#F2990D";

export default function AnalyticsPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [catTab, setCatTab] = React.useState<string>("all");

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setReady(true);
  }, [router]);

  const meals = useQuery({
    queryKey: ["admin-meals-analytics"],
    queryFn: () => api<{ items: Meal[] }>("/api/v1/admin/meals?limit=100"),
    enabled: ready && !!getAccessToken(),
  });

  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api<Overview>("/api/v1/admin/overview"),
    enabled: ready && !!getAccessToken(),
  });

  const categories = React.useMemo(() => {
    const names = new Map<string, string>();
    meals.data?.items.forEach((m) => names.set(m.category.id, m.category.name));
    return Array.from(names.entries());
  }, [meals.data]);

  const filteredMeals = React.useMemo(() => {
    if (!meals.data) return [];
    if (catTab === "all") return meals.data.items;
    return meals.data.items.filter((m) => m.category.id === catTab);
  }, [meals.data, catTab]);

  const coverByMealId = React.useMemo(() => {
    const m = new Map<string, string | null>();
    meals.data?.items.forEach((x) => m.set(x.id, x.coverUrl));
    return m;
  }, [meals.data]);

  const chartData = overview.data?.revenueByMonth.slice(-7) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Menu performance & sales signals</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setCatTab("all")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                catTab === "all" ? "bg-admin-orange text-white shadow-md shadow-orange-200/50" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All categories
            </button>
            {categories.map(([id, name]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCatTab(id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  catTab === id ? "bg-orange-100 text-admin-orange" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {meals.isLoading ? (
            <Skeleton className="h-80 w-full rounded-3xl" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredMeals.slice(0, 6).map((m, idx) => {
                const pct = 55 + ((idx * 13) % 35);
                return (
                  <div key={m.id} className="flex gap-4 rounded-3xl bg-white p-4 shadow-sm">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-orange-50">
                      <AdminMealCover
                        coverUrl={m.coverUrl}
                        alt=""
                        className="aspect-auto h-full w-full min-h-[6rem] rounded-2xl bg-orange-50"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 line-clamp-2">{m.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{m.category.name}</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-800">₹{m.basePrice}</span>
                        <div className="relative h-12 w-12">
                          <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#f1f5f9"
                              strokeWidth="4"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={ACCENT}
                              strokeWidth="4"
                              strokeDasharray={`${pct}, 100`}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Daily trending</h3>
            <ul className="space-y-3">
              {(overview.data?.popularMeals ?? []).slice(0, 5).map((m, i) => (
                <li key={m.mealId} className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-admin-orange">#{i + 1}</span>
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-orange-100 to-amber-100 ring-1 ring-orange-100">
                    <AdminMealCover
                      coverUrl={coverByMealId.get(m.mealId) ?? null}
                      alt=""
                      className="aspect-square h-full w-full min-h-10 rounded-full bg-transparent"
                    />
                  </div>
                  <div className="flex-1 truncate font-medium text-slate-800">{m.name}</div>
                  <span className="text-slate-500">{m.quantity}x</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold text-slate-700">Chart orders</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">Weekly</span>
            </div>
            <div className="h-48 min-h-[192px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={192}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`₹${Number(v ?? 0).toLocaleString()}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <Button asChild variant="link" className="mt-2 h-auto p-0 text-admin-orange">
              <Link href="/orders">View orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
