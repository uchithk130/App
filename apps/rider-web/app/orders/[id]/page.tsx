"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Navigation,
  User,
  CreditCard,
  Package,
  Clock,
  Store,
  CheckCircle2,
} from "lucide-react";
import { buildGoogleMapsUrl } from "@fitmeals/utils";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { SwipeToConfirm } from "@/components/swipe-to-confirm";

type RiderOrderDetail = {
  id: string;
  status: string;
  total: string;
  addressSnapshot: Record<string, unknown>;
  customer: { fullName: string; user: { phone: string | null } };
  payment: { method: string | null } | null;
  slot?: { label: string } | null;
  allowedNext: string[];
};

type StoreLocation = { name: string; address: string; lat: number; lng: number };

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked Up",
  OUT_FOR_DELIVERY: "On the Way",
  DELIVERED: "Delivered",
  FAILED_DELIVERY: "Failed",
};

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "text-amber-600",
  PICKED_UP: "text-blue-600",
  OUT_FOR_DELIVERY: "text-orange-600",
  DELIVERED: "text-emerald-600",
  FAILED_DELIVERY: "text-red-600",
};

const SWIPE_CONFIG: Record<string, { label: string; variant: "amber" | "green" | "red" }> = {
  PICKED_UP: { label: "Swipe — Picked up from counter", variant: "amber" },
  OUT_FOR_DELIVERY: { label: "Swipe — On the way to customer", variant: "amber" },
  DELIVERED: { label: "Swipe — Delivered to customer", variant: "green" },
  FAILED_DELIVERY: { label: "Swipe — Delivery failed", variant: "red" },
};

const STATUS_STEPS = ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];

function formatAddr(a: Record<string, unknown>) {
  return [a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(", ") || "Address";
}

function buildMapsUrl(a: Record<string, unknown>) {
  return buildGoogleMapsUrl({
    lat: a.lat ? Number(a.lat) : undefined,
    lng: a.lng ? Number(a.lng) : undefined,
    address: [a.line1, a.city, a.pincode].filter(Boolean).join(", "),
  });
}

function buildStoreUrl(s: StoreLocation) {
  return buildGoogleMapsUrl({ lat: s.lat, lng: s.lng, address: s.address });
}

function ProgressSteps({ current }: { current: string }) {
  const idx = STATUS_STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-1 px-1">
      {STATUS_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition ${
            i <= idx
              ? "bg-emerald-500 text-white"
              : "bg-slate-200 text-slate-400"
          }`}>
            {i < idx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 rounded-full transition ${i < idx ? "bg-emerald-500" : "bg-slate-200"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function RiderOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [ready, setReady] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setReady(true);
  }, [router]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const orderId = params.id ?? "";
  const detail = useQuery({
    queryKey: ["rider-order", orderId],
    queryFn: () => api<RiderOrderDetail>(`/api/v1/rider/orders/${orderId}`),
    enabled: ready && !!orderId && !!getAccessToken(),
    refetchInterval: 5_000,
  });

  const storeQ = useQuery({
    queryKey: ["store-location"],
    queryFn: () => api<{ location: StoreLocation | null }>("/api/v1/store-location"),
    enabled: ready && !!getAccessToken(),
    staleTime: 60_000,
  });

  const d = detail.data;
  const addr = d?.addressSnapshot ?? {};
  const store = storeQ.data?.location;
  const nextAction = d?.allowedNext?.[0];
  const swipe = nextAction ? SWIPE_CONFIG[nextAction] : undefined;

  const handleStatusUpdate = async () => {
    if (!nextAction) return;
    await api(`/api/v1/rider/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: nextAction,
        note: nextAction === "FAILED_DELIVERY" ? "Customer unavailable" : undefined,
      }),
    });
    setToast("Status updated!");
    await qc.invalidateQueries({ queryKey: ["rider-order", orderId] });
    void qc.invalidateQueries({ queryKey: ["rider-orders"] });
    void qc.invalidateQueries({ queryKey: ["rider-me"] });
    if (nextAction === "DELIVERED" || nextAction === "FAILED_DELIVERY") {
      setTimeout(() => router.push("/"), 1200);
    }
  };

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5 text-slate-800" />
        </Link>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-slate-900">Order #{orderId.slice(0, 8)}</h1>
          {d && (
            <span className={`text-[10px] font-bold ${STATUS_COLORS[d.status] ?? "text-slate-600"}`}>
              {STATUS_LABELS[d.status] ?? d.status}
            </span>
          )}
        </div>
      </div>

      {detail.isLoading ? (
        <div className="space-y-4 p-5">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : d ? (
        <div className="space-y-4 p-5">
          {/* Progress tracker */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Progress</h3>
              <span className={`text-[10px] font-bold ${STATUS_COLORS[d.status] ?? ""}`}>
                {STATUS_LABELS[d.status] ?? d.status}
              </span>
            </div>
            <ProgressSteps current={d.status} />
            <div className="mt-2 flex justify-between text-[9px] text-slate-400">
              <span>Accepted</span>
              <span>Picked Up</span>
              <span>On Way</span>
              <span>Delivered</span>
            </div>
          </div>

          {/* Customer card */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">{d.customer.fullName}</p>
                {d.customer.user.phone && (
                  <a href={`tel:${d.customer.user.phone}`} className="flex items-center gap-1 text-xs text-slate-500">
                    <Phone className="h-3 w-3" />
                    {d.customer.user.phone}
                  </a>
                )}
              </div>
              {d.customer.user.phone && (
                <a
                  href={`tel:${d.customer.user.phone}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-sm text-slate-700">{formatAddr(addr)}</p>
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="space-y-2">
            {/* Navigate to Counter/Store */}
            {store && (d.status === "ASSIGNED" || d.status === "PICKED_UP") && (
              <a
                href={buildStoreUrl(store)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3.5 text-white shadow-sm transition hover:from-blue-600 hover:to-blue-700"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Navigate to Counter</p>
                  <p className="truncate text-xs text-blue-100">{store.name} • {store.address}</p>
                </div>
                <Navigation className="h-5 w-5 shrink-0" />
              </a>
            )}

            {/* Navigate to Customer */}
            {(d.status === "PICKED_UP" || d.status === "OUT_FOR_DELIVERY") && (
              <a
                href={buildMapsUrl(addr)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3.5 text-white shadow-sm transition hover:from-amber-600 hover:to-orange-600"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Navigate to Customer</p>
                  <p className="truncate text-xs text-amber-100">{formatAddr(addr)}</p>
                </div>
                <Navigation className="h-5 w-5 shrink-0" />
              </a>
            )}

            {/* Call customer */}
            {d.customer.user.phone && (
              <a
                href={`tel:${d.customer.user.phone}`}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <Phone className="h-4 w-4" />
                <span className="flex-1 text-sm font-bold">Call Customer</span>
                <span className="text-xs text-slate-400">{d.customer.user.phone}</span>
              </a>
            )}
          </div>

          {/* Order info */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Order Info</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <Package className="h-4 w-4" />
                  Amount
                </span>
                <span className="font-bold tabular-nums text-slate-900">{"\u20B9"}{Math.round(Number(d.total))}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <CreditCard className="h-4 w-4" />
                  Payment
                </span>
                <span className="font-semibold text-slate-700">{d.payment?.method ?? "N/A"}</span>
              </div>
              {d.slot && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-4 w-4" />
                    Slot
                  </span>
                  <span className="font-semibold text-slate-700">{d.slot.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Swipe to update status */}
          {swipe && nextAction && (
            <SwipeToConfirm
              label={swipe.label}
              variant={swipe.variant}
              onConfirm={handleStatusUpdate}
            />
          )}

          {/* All done */}
          {d.status === "DELIVERED" && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
              <p className="text-sm font-bold text-emerald-700">Delivery Completed!</p>
              <p className="text-xs text-emerald-600">Great job. Head back for the next one.</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-slate-800 px-5 py-2.5 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
