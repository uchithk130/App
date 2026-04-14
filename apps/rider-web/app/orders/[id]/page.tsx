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

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Assigned",
  OUT_FOR_DELIVERY: "On the Way",
  DELIVERED: "Delivered",
  FAILED_DELIVERY: "Failed",
};

const SWIPE_CONFIG: Record<string, { label: string; variant: "amber" | "green" | "red" }> = {
  OUT_FOR_DELIVERY: { label: "Swipe to start delivery", variant: "amber" },
  DELIVERED: { label: "Swipe to confirm delivered", variant: "green" },
  FAILED_DELIVERY: { label: "Swipe to mark failed", variant: "red" },
};

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
  });

  const d = detail.data;
  const addr = d?.addressSnapshot ?? {};
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
    void qc.invalidateQueries({ queryKey: ["rider-order", orderId] });
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
            <span className={`text-[10px] font-bold ${d.status === "OUT_FOR_DELIVERY" ? "text-orange-600" : d.status === "DELIVERED" ? "text-emerald-600" : "text-amber-600"}`}>
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

            {/* Delivery address */}
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-sm text-slate-700">{formatAddr(addr)}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={buildMapsUrl(addr)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600"
            >
              <Navigation className="h-4 w-4" />
              Navigate
            </a>
            {d.customer.user.phone ? (
              <a
                href={`tel:${d.customer.user.phone}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                <Phone className="h-4 w-4" />
                Call Customer
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3.5 text-sm font-bold text-slate-400">
                <Phone className="h-4 w-4" />
                No phone
              </div>
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
