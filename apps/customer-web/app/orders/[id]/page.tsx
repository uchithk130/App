"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Package, Star } from "lucide-react";
import { Skeleton } from "@fitmeals/ui";
import { formatInr } from "@fitmeals/utils";
import { api } from "@/lib/api";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { RiderInfoCard } from "@/components/tracking/rider-info-card";
import { ProgressTracker } from "@/components/tracking/progress-tracker";
import { TrackingMap } from "@/components/tracking/tracking-map";
import { PostDeliveryModal } from "@/components/post-delivery";

type OrderDetail = {
  id: string;
  status: string;
  subtotal: string;
  deliveryFee: string;
  tax: string;
  discount: string;
  total: string;
  addressSnapshot: {
    line1: string;
    line2?: string;
    city: string;
    lat?: string;
    lng?: string;
  };
  createdAt: string;
  items: { id: string; quantity: number; unitPrice: string; meal: { name: string; slug: string; coverUrl: string | null } }[];
  assignment: { rider: { id: string; fullName: string } } | null;
  statusLogs: { status: string; createdAt: string }[];
};

const TRACKING_STEPS = [
  { status: "PAID", label: "Order Confirmed" },
  { status: "CONFIRMED", label: "Order Accepted" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { status: "ASSIGNED", label: "Rider Assigned" },
  { status: "OUT_FOR_DELIVERY", label: "On the Way" },
  { status: "DELIVERED", label: "Delivered" },
] as const;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function OrderTrackingPage() {
const params = useParams<{ id: string }>();
const router = useRouter();
const [deliveryModalOpen, setDeliveryModalOpen] = React.useState(false);
const [deliveryModalDismissed, setDeliveryModalDismissed] = React.useState(false);
const prevStatusRef = React.useRef<string | null>(null);

const q = useQuery({
  queryKey: ["order", params.id],
  queryFn: () => api<OrderDetail>(`/api/v1/orders/${params.id}`),
  enabled: !!params.id,
  refetchInterval: 10000,
});

const order = q.data;

// Show delivery-success modal when status transitions to DELIVERED
React.useEffect(() => {
  if (!order) return;
  if (order.status === "DELIVERED" && prevStatusRef.current && prevStatusRef.current !== "DELIVERED" && !deliveryModalDismissed) {
    setDeliveryModalOpen(true);
  }
  prevStatusRef.current = order.status;
  }, [order, deliveryModalDismissed]);

  const logMap = React.useMemo(() => {
    if (!order) return new Map<string, string>();
    const m = new Map<string, string>();
    for (const l of order.statusLogs) m.set(l.status, l.createdAt);
    return m;
  }, [order]);

  const currentIdx = order
    ? TRACKING_STEPS.findIndex((s) => s.status === order.status)
    : -1;

  const steps = TRACKING_STEPS.map((s, i) => ({
    label: s.label,
    time: logMap.get(s.status) ? formatTime(logMap.get(s.status)!) : undefined,
    done: i < currentIdx || (i === currentIdx && order?.status === "DELIVERED"),
    active: i === currentIdx && order?.status !== "DELIVERED",
  }));

  const destLat = order?.addressSnapshot?.lat ? Number(order.addressSnapshot.lat) : null;
  const destLng = order?.addressSnapshot?.lng ? Number(order.addressSnapshot.lng) : null;
  const destination: [number, number] | null =
    destLat && destLng ? [destLat, destLng] : null;

  const isCancellable =
    order && ["PAID", "CONFIRMED", "PENDING_PAYMENT"].includes(order.status);

  return (
    <KcalViewportShell>
      <div className="relative z-10 flex min-h-dvh flex-col bg-[#f7f8f7]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
          <Link
            href="/orders"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-slate-800" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-slate-900">Order Tracking</h1>
            {order && (
              <p className="truncate text-xs text-slate-500">#{order.id.slice(0, 8)}</p>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 pb-10 pt-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 lg:px-6">
          {/* Loading */}
          {q.isLoading && (
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-56 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          )}

          {/* Error */}
          {q.isError && (
            <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-600 lg:col-span-2">
              {(q.error as Error).message}
            </p>
          )}

          {order && (
            <>
              {/* Map (left column on desktop) */}
              <div className="lg:sticky lg:top-20 lg:self-start">
                <TrackingMap destination={destination} riderPosition={null} />

                {/* Estimated time */}
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <Clock className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Estimated delivery</p>
                    <p className="text-sm font-bold text-slate-900">
                      {order.status === "DELIVERED" ? "Delivered" : "25 - 35 min"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info column (right on desktop) */}
              <div className="space-y-4">
                {/* Rider */}
                {order.assignment ? (
                  <RiderInfoCard
                    name={order.assignment.rider.fullName}
                    orderId={order.id}
                  />
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                      <Package className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Finding a rider</p>
                      <p className="text-xs text-slate-500">We&apos;re assigning a delivery partner...</p>
                    </div>
                  </div>
                )}

                {/* Progress */}
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">Delivery Progress</h3>
                  <ProgressTracker steps={steps} />
                </div>

                {/* Order summary */}
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">My Order</h3>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          {item.quantity}x {item.meal.name}
                        </span>
                        <span className="font-medium text-slate-900">
                          {formatInr(Number(item.unitPrice) * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <hr className="border-slate-100" />
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Subtotal</span>
                      <span>{formatInr(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Delivery</span>
                      <span>{formatInr(order.deliveryFee)}</span>
                    </div>
                    {Number(order.discount) > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Discount</span>
                        <span>?{formatInr(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-slate-900">
                      <span>Total</span>
                      <span>{formatInr(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Cancel */}
                {isCancellable && (
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                  >
                    Cancel Order
                  </button>
                )}

                {/* Rate Order CTA - shown after delivery */}
                {order.status === "DELIVERED" && (
                  <Link
                    href={`/orders/${params.id}/review`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    <Star className="h-4.5 w-4.5" />
                    Rate Your Order
                  </Link>
                )}
              </div>
            </>
          )}
        </main>

        {/* Delivery Success Modal */}
        <PostDeliveryModal
          open={deliveryModalOpen}
          title="Delivery Successful!"
          message="Your healthy meal has arrived. Enjoy every bite!"
          ctaLabel="Rate Your Experience"
          onCta={() => {
            setDeliveryModalOpen(false);
            setDeliveryModalDismissed(true);
            router.push(`/orders/${params.id}/review`);
          }}
          onClose={() => {
            setDeliveryModalOpen(false);
            setDeliveryModalDismissed(true);
          }}
        />
      </div>
    </KcalViewportShell>
  );
}
