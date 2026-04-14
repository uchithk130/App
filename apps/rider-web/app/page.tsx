"use client";

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import {
  MapPin,
  Package,
  ChevronRight,
  Wallet,
  TrendingUp,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { API_BASE } from "@/lib/config";

type RiderMe = {
  id: string;
  fullName: string;
  availability: string;
  stats: { activeOrders: number; todayDelivered: number; totalDeliveries: number };
  walletBalance: string;
};

type OrderRow = {
  id: string;
  status: string;
  total: string;
  addressSnapshot: Record<string, unknown>;
  customer: { fullName: string; user: { phone: string | null } };
};

function useRiderLocationPush(hasActiveOrders: boolean) {
  React.useEffect(() => {
    if (!hasActiveOrders || !("geolocation" in navigator)) return;

    let watchId: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let lastLat: number | null = null;
    let lastLng: number | null = null;

    function pushToServer() {
      if (lastLat == null || lastLng == null || !getAccessToken()) return;
      void fetch(`${API_BASE}/api/v1/rider/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify({ lat: lastLat, lng: lastLng }),
      }).catch(() => {});
    }

    // watchPosition asks for permission once, then silently streams updates
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        lastLat = pos.coords.latitude;
        lastLng = pos.coords.longitude;
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    // Push the cached coordinates to the server every 10 seconds
    pushToServer();
    intervalId = setInterval(pushToServer, 10_000);

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      if (intervalId != null) clearInterval(intervalId);
    };
  }, [hasActiveOrders]);
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

export default function RiderHomePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setMounted(true);
  }, [router]);

  const enabled = mounted && !!getAccessToken();

  const me = useQuery({
    queryKey: ["rider-me"],
    queryFn: () => api<RiderMe>("/api/v1/rider/me"),
    enabled,
    refetchInterval: 30_000,
  });

  const orders = useQuery({
    queryKey: ["rider-orders"],
    queryFn: () => api<{ items: OrderRow[] }>("/api/v1/rider/orders"),
    enabled,
    refetchInterval: 15_000,
  });

  const toggleAvailability = useMutation({
    mutationFn: (next: string) =>
      api("/api/v1/rider/availability", {
        method: "PATCH",
        body: JSON.stringify({ availability: next }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["rider-me"] }),
  });

  useRiderLocationPush((orders.data?.items.length ?? 0) > 0);

  const isOnline = me.data?.availability === "AVAILABLE";
  const activeOrders = (orders.data?.items ?? []).filter((o) =>
    ["ASSIGNED", "OUT_FOR_DELIVERY"].includes(o.status)
  );

  if (!mounted) return null;

  return (
    <div className="pb-28 pt-4">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between px-5">
        <div>
          {me.isLoading ? (
            <Skeleton className="h-6 w-32 rounded" />
          ) : (
            <>
              <p className="text-xs text-slate-500">Good day,</p>
              <h1 className="text-xl font-bold text-slate-900">{me.data?.fullName ?? "Rider"}</h1>
            </>
          )}
        </div>
        <Link
          href="/wallet"
          className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100"
        >
          <Wallet className="h-3.5 w-3.5" />
          {me.data ? `\u20B9${Math.round(Number(me.data.walletBalance))}` : "..."}
        </Link>
      </div>

      {/* Online/Offline toggle */}
      <div className="mb-5 px-5">
        <button
          type="button"
          disabled={toggleAvailability.isPending}
          onClick={() => toggleAvailability.mutate(isOnline ? "OFFLINE" : "AVAILABLE")}
          className={`flex w-full items-center justify-between rounded-2xl p-4 shadow-sm transition ${
            isOnline
              ? "bg-emerald-500 text-white"
              : "bg-white text-slate-700 ring-1 ring-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isOnline ? "bg-white animate-pulse" : "bg-slate-300"}`} />
            <span className="text-sm font-bold">{isOnline ? "You are Online" : "You are Offline"}</span>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
            isOnline ? "bg-white/20 text-white" : "bg-amber-50 text-amber-700"
          }`}>
            {isOnline ? "Go Offline" : "Go Online"}
          </span>
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3 px-5">
        <StatCard
          icon={Package}
          label="Active"
          value={me.data?.stats.activeOrders ?? 0}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Today"
          value={me.data?.stats.todayDelivered ?? 0}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Total"
          value={me.data?.stats.totalDeliveries ?? 0}
          accent="bg-sky-50 text-sky-600"
        />
      </div>

      {/* Active deliveries */}
      <div className="px-5">
        <h2 className="mb-3 text-sm font-bold text-slate-700">Active Deliveries</h2>
        {orders.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
            <Zap className="mb-2 h-8 w-8 text-amber-300" />
            <p className="text-sm font-semibold text-slate-600">
              {isOnline ? "Waiting for new orders..." : "Go online to receive orders"}
            </p>
            <p className="mt-1 text-xs text-slate-400">Assigned orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((o) => {
              const addr = o.addressSnapshot;
              const line = [addr.line1, addr.city].filter(Boolean).join(", ") || "Address";
              const statusColors: Record<string, string> = {
                ASSIGNED: "bg-amber-50 text-amber-700",
                OUT_FOR_DELIVERY: "bg-orange-50 text-orange-700",
              };
              return (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition active:bg-slate-50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{o.customer.fullName}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{line}</span>
                    </div>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[o.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {o.status === "OUT_FOR_DELIVERY" ? "On the way" : o.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-slate-700">{"\u20B9"}{Math.round(Number(o.total))}</p>
                    <ChevronRight className="mt-1 ml-auto h-4 w-4 text-slate-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
