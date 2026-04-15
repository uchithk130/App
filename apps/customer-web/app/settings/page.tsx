"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ToggleSwitch } from "@fitmeals/ui";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";

const KEYS = {
  notifyOrders: "kcal_pref_notify_orders",
  notifyPromos: "kcal_pref_notify_promos",
  useMetric: "kcal_pref_metric_units",
} as const;

function readBool(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  return v === "1";
}

export default function SettingsPage() {
  const [orders, setOrders] = React.useState(true);
  const [promos, setPromos] = React.useState(true);
  const [metric, setMetric] = React.useState(false);

  React.useEffect(() => {
    setOrders(readBool(KEYS.notifyOrders, true));
    setPromos(readBool(KEYS.notifyPromos, true));
    setMetric(readBool(KEYS.useMetric, false));
  }, []);

  const persist = (key: string, value: boolean) => {
    localStorage.setItem(key, value ? "1" : "0");
  };

  return (
    <KcalViewportShell>
      <div className="min-h-dvh bg-white">
        <main className="mx-auto max-w-kcal px-5 pb-10 pt-8">
          <Link
            href="/profile"
            className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-kcal-sage"
          >
            <ChevronLeft className="h-4 w-4" />
            Profile
          </Link>
          <h1 className="text-2xl font-bold text-kcal-charcoal">Settings</h1>
          <p className="mt-2 text-sm text-kcal-muted">Preferences are saved on this device.</p>

          <ul className="mt-8 divide-y divide-neutral-100 rounded-kcal-xl border border-neutral-100">
            <li className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="font-medium text-kcal-charcoal">Order updates</p>
                <p className="text-xs text-kcal-muted">Push-style alerts when your order status changes</p>
              </div>
              <ToggleSwitch
                checked={orders}
                onChange={(next) => { setOrders(next); persist(KEYS.notifyOrders, next); }}
                label="Order updates"
              />
            </li>
            <li className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="font-medium text-kcal-charcoal">Tips &amp; promos</p>
                <p className="text-xs text-kcal-muted">Occasional meal ideas and offers</p>
              </div>
              <ToggleSwitch
                checked={promos}
                onChange={(next) => { setPromos(next); persist(KEYS.notifyPromos, next); }}
                label="Tips and promos"
              />
            </li>
            <li className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="font-medium text-kcal-charcoal">Metric units</p>
                <p className="text-xs text-kcal-muted">Show grams &amp; °C where relevant</p>
              </div>
              <ToggleSwitch
                checked={metric}
                onChange={(next) => { setMetric(next); persist(KEYS.useMetric, next); }}
                label="Metric units"
              />
            </li>
          </ul>
        </main>
      </div>
    </KcalViewportShell>
  );
}
