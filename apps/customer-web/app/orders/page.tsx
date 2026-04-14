"use client";

"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Search, Star, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@fitmeals/ui";
import { formatInr } from "@fitmeals/utils";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { KcalAppLayout } from "@/components/kcal/kcal-app-layout";

/* ── Types ── */
type PreviewItem = {
  id: string;
  mealId: string;
  mealName: string;
  thumbnailUrl: string | null;
};

type OrderSummary = {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  subtotal: string;
  deliveryFee: string;
  tax: string;
  discount: string;
  total: string;
  itemCount: number;
  previewItems: PreviewItem[];
  rating: { orderRating: number | null; mealAverage: number | null; display: number | null };
  coupon: { id: string; code: string; title: string | null } | null;
};

/* ── Status filter ── */
const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type StatusKey = (typeof STATUS_TABS)[number]["key"];

/* ── Status badge config ── */
const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Pending", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  PAID: { label: "Confirmed", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  CONFIRMED: { label: "Confirmed", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  PREPARING: { label: "Preparing", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  READY_FOR_PICKUP: { label: "Ready", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  ASSIGNED: { label: "Rider Assigned", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  OUT_FOR_DELIVERY: { label: "On the way", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  DELIVERED: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-rose-50 text-rose-600 ring-rose-200" },
  REFUNDED: { label: "Refunded", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  FAILED_DELIVERY: { label: "Failed", cls: "bg-rose-50 text-rose-600 ring-rose-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? { label: status.replace(/_/g, " "), cls: "bg-slate-50 text-slate-600 ring-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

/* ── Stacked thumbnails ── */
function StackedThumbnails({ items }: { items: PreviewItem[] }) {
  const show = items.slice(0, 3);
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
      {show.length === 0 && (
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50">
          <Package className="h-6 w-6 text-emerald-500" />
        </div>
      )}
      {show.length === 1 && (
        <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100 ring-2 ring-white">
          {show[0]!.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={show[0]!.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
              <Package className="h-5 w-5" />
            </div>
          )}
        </div>
      )}
      {show.length >= 2 &&
        show.map((item, idx) => (
          <div
            key={item.id}
            className="absolute overflow-hidden rounded-lg bg-slate-100 ring-2 ring-white"
            style={{
              width: 36,
              height: 36,
              left: idx * 12,
              top: idx * 4,
              zIndex: show.length - idx,
            }}
          >
            {item.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <Package className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

/* ── Rating stars ── */
function RatingStars({ value }: { value: number | null }) {
  if (value == null) return null;
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${s <= full ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
        />
      ))}
    </div>
  );
}

/* ── Order card ── */
function OrderCard({ order }: { order: OrderSummary }) {
  const shortId = order.id.slice(-6).toUpperCase();
  const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex gap-3.5 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100 transition active:scale-[0.99] hover:ring-emerald-200"
    >
      <StackedThumbnails items={order.previewItems} />

      <div className="min-w-0 flex-1">
        {/* Row 1: Order ID + status */}
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500">#{shortId}</span>
          <StatusBadge status={order.status} />
        </div>

        {/* Row 2: Meal names */}
        <p className="mb-1 truncate text-sm font-semibold text-slate-900">
          {order.previewItems.map((i) => i.mealName).join(", ")}
        </p>

        {/* Row 3: Rating + date + total */}
        <div className="flex items-center gap-2">
          <RatingStars value={order.rating.display} />
          <span className="text-[11px] text-slate-400">{dateStr}</span>
          <span className="ml-auto text-sm font-bold text-slate-900">{formatInr(order.total)}</span>
        </div>

        {/* Coupon badge */}
        {order.coupon && Number(order.discount) > 0 && (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            {order.coupon.code} saved {formatInr(order.discount)}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ── Skeleton ── */
function OrderSkeleton() {
  return (
    <div className="flex gap-3.5 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100">
      <Skeleton className="h-14 w-14 rounded-xl" />
      <div className="flex-1 space-y-2 py-0.5">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function OrdersPage() {
  const [authed, setAuthed] = React.useState(false);
  React.useEffect(() => setAuthed(!!getAccessToken()), []);

  const [statusFilter, setStatusFilter] = React.useState<StatusKey>("all");
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = new URLSearchParams();
  params.set("limit", "50");
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (debouncedSearch.length >= 2) params.set("search", debouncedSearch);

  const q = useQuery({
    queryKey: ["orders", statusFilter, debouncedSearch],
    queryFn: () => api<{ items: OrderSummary[]; nextCursor: string | null }>(`/api/v1/orders?${params.toString()}`),
    enabled: authed,
  });

  const orders = q.data?.items ?? [];
  const isEmpty = q.isSuccess && orders.length === 0;

  return (
    <KcalViewportShell>
      <KcalAppLayout>
        <div className="relative z-10 flex min-h-dvh flex-col bg-[#f7f8f7]">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3">
              <Link
                href="/"
                className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-slate-800" />
              </Link>
              <h1 className="flex-1 text-lg font-bold text-slate-900">Orders</h1>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 px-4 pb-3">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-slate-200 focus-within:ring-emerald-400">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search orders..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                aria-label="Filters"
              >
                <SlidersHorizontal className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Status chips */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    statusFilter === tab.key
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </header>

          {/* Content */}
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-6 pt-4 max-lg:kcal-safe-pb lg:px-6 lg:pb-10">
            {/* Loading */}
            {q.isLoading && (
              <div className="space-y-3" data-testid="orders-skeleton">
                {[1, 2, 3, 4].map((i) => (
                  <OrderSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error */}
            {q.isError && (
              <div className="flex flex-col items-center rounded-2xl bg-rose-50 px-6 py-10 text-center" data-testid="orders-error">
                <p className="mb-3 text-sm text-rose-600">{(q.error as Error).message}</p>
                <button
                  type="button"
                  onClick={() => void q.refetch()}
                  className="rounded-full bg-rose-600 px-5 py-2 text-xs font-bold text-white"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {isEmpty && !debouncedSearch && (
              <div
                className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center"
                data-testid="orders-empty"
              >
                <Package className="mb-4 h-14 w-14 text-slate-200" strokeWidth={1.5} />
                <p className="mb-1 text-sm font-semibold text-slate-800">
                  {statusFilter === "all"
                    ? "No orders yet"
                    : `No ${statusFilter} orders`}
                </p>
                <p className="mb-6 text-xs text-slate-500">
                  {statusFilter === "all"
                    ? "Place your first healthy meal order"
                    : "Check another filter or place a new order"}
                </p>
                <Link
                  href="/menu"
                  className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20"
                >
                  Browse Menu
                </Link>
              </div>
            )}

            {/* Search empty */}
            {isEmpty && debouncedSearch && (
              <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center ring-1 ring-slate-100">
                <Search className="mb-3 h-10 w-10 text-slate-200" strokeWidth={1.5} />
                <p className="mb-1 text-sm font-semibold text-slate-700">No results</p>
                <p className="text-xs text-slate-500">
                  No orders matching &quot;{debouncedSearch}&quot;
                </p>
              </div>
            )}

            {/* Order list */}
            {orders.length > 0 && (
              <div className="space-y-3" data-testid="orders-list">
                {orders.map((o) => (
                  <OrderCard key={o.id} order={o} />
                ))}
              </div>
            )}
          </main>
        </div>
      </KcalAppLayout>
    </KcalViewportShell>
  );
}
