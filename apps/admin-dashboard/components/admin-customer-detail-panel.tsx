"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, MapPin, Package, ShoppingBag } from "lucide-react";

export type AdminCustomerDetail = {
  id: string;
  fullName: string;
  gender: string | null;
  dateOfBirth: string | null;
  heightCm: number | null;
  weightKg: string | null;
  activityLevel: string | null;
  fitnessGoal: string | null;
  dietaryPreference: string | null;
  allergies: string | null;
  intolerances: string | null;
  healthNotes: string | null;
  preferredMealTimes: string | null;
  dailyCalorieGoal: number | null;
  targetProteinG: number | null;
  targetCarbG: number | null;
  targetFatG: number | null;
  emergencyContact: string | null;
  deliveryNotes: string | null;
  email: string;
  phone: string | null;
  userCreatedAt: string;
  profileCreatedAt: string;
  addresses: {
    id: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }[];
  stats: { orderCount: number; lifetimeSpend: string };
  recentOrders: {
    id: string;
    status: string;
    type: string;
    total: string;
    createdAt: string;
  }[];
  favorites: {
    mealId: string;
    name: string;
    slug: string;
    basePrice: string;
    savedAt: string;
  }[];
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function fmtMoney(s: string) {
  return `₹${s}`;
}

const orderStatusTone: Record<string, string> = {
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200",
};

export function AdminCustomerDetailPanel({ data }: { data: AdminCustomerDetail }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{data.fullName}</p>
        <p className="text-sm text-slate-500 dark:text-zinc-400">{data.email}</p>
        {data.phone ? <p className="text-sm text-slate-500 dark:text-zinc-400">{data.phone}</p> : null}
        <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
          Member since {fmtDate(data.profileCreatedAt)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
            <ShoppingBag className="h-3.5 w-3.5" />
            Orders
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-zinc-50">{data.stats.orderCount}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
            <Package className="h-3.5 w-3.5" />
            Lifetime spend
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-zinc-50">{fmtMoney(data.stats.lifetimeSpend)}</p>
        </div>
      </div>

      {data.addresses.length > 0 ? (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-zinc-200">
            <MapPin className="h-4 w-4" />
            Addresses
          </h3>
          <ul className="space-y-2">
            {data.addresses.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-slate-100 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                {a.isDefault ? (
                  <span className="mb-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                    Default
                  </span>
                ) : null}
                <p className="text-slate-800 dark:text-zinc-200">{a.line1}</p>
                <p className="text-slate-500 dark:text-zinc-400">
                  {a.city}, {a.state} {a.pincode}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(() => {
        const profileRows: [string, string | null][] = [
          ["Gender", data.gender],
          ["Date of birth", data.dateOfBirth ? fmtDate(data.dateOfBirth) : null],
          ["Height (cm)", data.heightCm != null ? String(data.heightCm) : null],
          ["Weight (kg)", data.weightKg],
          ["Activity", data.activityLevel],
          ["Fitness goal", data.fitnessGoal ? data.fitnessGoal.replaceAll("_", " ") : null],
          ["Diet", data.dietaryPreference ? data.dietaryPreference.replaceAll("_", " ") : null],
          ["Allergies", data.allergies],
          ["Intolerances", data.intolerances],
          ["Daily calories", data.dailyCalorieGoal != null ? String(data.dailyCalorieGoal) : null],
          [
            "P / C / F (g)",
            [data.targetProteinG, data.targetCarbG, data.targetFatG].every((x) => x == null)
              ? null
              : `${data.targetProteinG ?? "—"} / ${data.targetCarbG ?? "—"} / ${data.targetFatG ?? "—"}`,
          ],
          ["Preferred meal times", data.preferredMealTimes],
          ["Emergency contact", data.emergencyContact],
          ["Delivery notes", data.deliveryNotes],
          ["Health notes", data.healthNotes],
        ];
        const filled = profileRows.filter(([, v]) => v != null && String(v).trim() !== "");
        if (filled.length === 0) return null;
        return (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">Profile & goals</h3>
            <dl className="space-y-2 text-sm">
              {filled.map(([label, val]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-slate-100 py-1.5 last:border-0 dark:border-zinc-800"
                >
                  <dt className="shrink-0 text-slate-500 dark:text-zinc-400">{label}</dt>
                  <dd className="text-right font-medium text-slate-800 dark:text-zinc-200">{val}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })()}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">Recent orders</h3>
        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 dark:divide-zinc-800 dark:border-zinc-800">
            {data.recentOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <div>
                  <span className="font-mono text-xs text-slate-500 dark:text-zinc-500">{o.id.slice(0, 8)}…</span>
                  <span className="ml-2 text-slate-600 dark:text-zinc-300">{o.type.replaceAll("_", " ")}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${orderStatusTone[o.status] ?? "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"}`}
                  >
                    {o.status.replaceAll("_", " ")}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-zinc-50">{fmtMoney(o.total)}</span>
                  <span className="text-xs text-slate-400">{fmtDate(o.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-zinc-200">
          <Heart className="h-4 w-4 text-rose-500" />
          Favorites
        </h3>
        {data.favorites.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400">No saved meals.</p>
        ) : (
          <ul className="space-y-2">
            {data.favorites.map((f) => (
              <li
                key={f.mealId}
                className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900/30"
              >
                <div>
                  <Link
                    href={`/meals/${f.mealId}/edit`}
                    className="font-medium text-admin-orange hover:underline dark:text-orange-400"
                  >
                    {f.name}
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">
                    {fmtMoney(f.basePrice)} · saved {fmtDate(f.savedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
