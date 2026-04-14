"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { Button, Skeleton } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { ADMIN_AMBER, ADMIN_ORANGE } from "@/lib/admin-theme";

const ACCENT = ADMIN_ORANGE;
const ACCENT_SOFT = ADMIN_AMBER;
const MUTED = "#e2e8f0";

type Overview = {
  totalMenus: number;
  todayOrders: number;
  totalCustomers: number;
  completionRate: number;
  outForDelivery: number;
  deliveredOrders: number;
  failedDeliveries: number;
  cancelledOrders: number;
  revenueToday: string;
  revenueThisMonth: string;
  ordersLast7Days: { date: string; orders: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  popularMeals: { mealId: string; name: string; quantity: number }[];
};

export function SegoDashboard() {
  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api<Overview>("/api/v1/admin/overview"),
  });

  if (overview.isLoading) return <Skeleton className="h-96 w-full" data-testid="admin-overview-skeleton" />;
  if (overview.isError) {
    return (
      <p className="text-destructive" data-testid="admin-overview-error">
        {(overview.error as Error).message}
      </p>
    );
  }

  const d = overview.data!;
  const donut = [
    { name: "Done", value: d.completionRate },
    { name: "Rest", value: Math.max(0, 100 - d.completionRate) },
  ];

  const statCards = [
    { label: "Total menus", value: d.totalMenus, sub: "Meals in catalog" },
    { label: "Total revenue", value: `₹${Number(d.revenueThisMonth).toLocaleString()}`, sub: "This month" },
    { label: "Total orders", value: d.todayOrders, sub: "Today" },
    { label: "Total customers", value: d.totalCustomers, sub: "Registered" },
  ];

  const quick = [
    { label: "On delivery", value: d.outForDelivery, color: ACCENT },
    { label: "Delivered", value: d.deliveredOrders, color: "#22c55e" },
    { label: "Canceled", value: d.cancelledOrders, color: "#94a3b8" },
  ];

  const barData = d.ordersLast7Days.map((x) => ({
    day: x.date.slice(5),
    a: Math.round(x.orders * 0.55),
    b: x.orders - Math.round(x.orders * 0.55),
  }));

  return (
    <div className="space-y-6" data-testid="admin-kpis">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="sr-only">Dashboard</h2>
          <p className="text-sm text-slate-500">Operations at a glance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-full bg-gradient-to-r from-admin-orange to-amber-500 font-semibold text-white shadow-lg shadow-orange-200/40">
            <Link href="/meals/new">+ New meal</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-slate-200">
            <Link href="/orders">Orders</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-admin-orange to-amber-500 p-6 text-white shadow-lg shadow-orange-200/30"
          >
            <div className="text-3xl font-bold tabular-nums">{c.value}</div>
            <div className="mt-1 text-sm font-medium text-white/90">{c.label}</div>
            <div className="mt-0.5 text-xs text-white/70">{c.sub}</div>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Order fulfillment</h3>
              <p className="text-sm text-slate-500">Delivered vs issues</p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full text-xs">
              <Link href="/orders">More details</Link>
            </Button>
          </div>
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="relative h-52 w-52 min-h-[208px] min-w-[208px] shrink-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={donut} cx="50%" cy="50%" innerRadius={58} outerRadius={78} dataKey="value" strokeWidth={0}>
                    {donut.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? ACCENT : MUTED} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">{d.completionRate}%</div>
                  <div className="text-xs text-slate-500">done</div>
                </div>
              </div>
            </div>
            <div className="w-full flex-1 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">₹{Number(d.revenueToday).toLocaleString()}</div>
                <div className="text-xs text-slate-500">Revenue today</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {quick.map((q) => (
                  <div key={q.label} className="rounded-xl border border-slate-100 py-2">
                    <div className="text-lg font-bold tabular-nums" style={{ color: q.color }}>
                      {q.value}
                    </div>
                    <div className="text-slate-500">{q.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue</h3>
              <p className="text-sm text-slate-500">Monthly trend</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Monthly</span>
          </div>
          <div className="mb-2 text-2xl font-bold text-slate-900">₹{Number(d.revenueThisMonth).toLocaleString()}</div>
          <div className="h-56 min-h-[224px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={224}>
              <LineChart data={d.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(v) => [`₹${Number(v ?? 0).toLocaleString()}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={3} dot={{ fill: ACCENT, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-900">Orders (last 7 days)</h3>
            <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-xs">
              {["Today", "Weekly", "Monthly"].map((t) => (
                <span key={t} className="rounded-full px-3 py-1 text-slate-500">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="h-64 min-h-[256px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="a" stackId="x" fill={ACCENT} radius={[0, 0, 0, 0]} />
                <Bar dataKey="b" stackId="x" fill={ACCENT_SOFT} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Daily trending menus</h3>
          <ul className="space-y-4">
            {d.popularMeals.slice(0, 5).map((m, i) => (
              <li key={m.mealId} className="flex items-center gap-3">
                <span className="text-sm font-bold text-admin-orange">#{i + 1}</span>
                <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-orange-100 to-amber-100" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">{m.name}</div>
                  <div className="text-xs text-slate-500">Orders {m.quantity}x</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
