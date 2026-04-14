"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import { MapPin, Package, ChevronRight, ClipboardList } from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type OrderRow = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  addressSnapshot: Record<string, unknown>;
  customer: { fullName: string; user: { phone: string | null } };
};

const STATUS_STYLES: Record<string, string> = {
  ASSIGNED: "bg-amber-50 text-amber-700",
  OUT_FOR_DELIVERY: "bg-orange-50 text-orange-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  FAILED_DELIVERY: "bg-rose-50 text-rose-600",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Assigned",
  OUT_FOR_DELIVERY: "On the Way",
  DELIVERED: "Delivered",
  FAILED_DELIVERY: "Failed",
  CANCELLED: "Cancelled",
};

export default function RiderOrdersPage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setMounted(true);
  }, [router]);

  const orders = useQuery({
    queryKey: ["rider-orders"],
    queryFn: () => api<{ items: OrderRow[] }>("/api/v1/rider/orders"),
    enabled: mounted && !!getAccessToken(),
    refetchInterval: 15_000,
  });

  const items = orders.data?.items ?? [];
  const active = items.filter((o) => ["ASSIGNED", "OUT_FOR_DELIVERY"].includes(o.status));
  const completed = items.filter((o) => !["ASSIGNED", "OUT_FOR_DELIVERY"].includes(o.status));

  if (!mounted) return null;

  return (
    <div className="pb-28 pt-4">
      <div className="mb-5 px-5">
        <h1 className="text-xl font-bold text-slate-900">My Orders</h1>
        <p className="text-xs text-slate-500">Your assigned and completed deliveries</p>
      </div>

      {orders.isLoading ? (
        <div className="space-y-3 px-5">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mx-5 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <ClipboardList className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No orders yet</p>
          <p className="mt-1 text-xs text-slate-400">Orders assigned to you will appear here</p>
        </div>
      ) : (
        <div className="space-y-5 px-5">
          {/* Active */}
          {active.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                Active ({active.length})
              </h2>
              <div className="space-y-2">
                {active.map((o) => (
                  <OrderCard key={o.id} order={o} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Completed ({completed.length})
              </h2>
              <div className="space-y-2">
                {completed.map((o) => (
                  <OrderCard key={o.id} order={o} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order: o }: { order: OrderRow }) {
  const addr = o.addressSnapshot;
  const line = [addr.line1, addr.city].filter(Boolean).join(", ") || "Address";
  const isActive = ["ASSIGNED", "OUT_FOR_DELIVERY"].includes(o.status);

  return (
    <Link
      href={`/orders/${o.id}`}
      className={`flex items-center gap-3 rounded-2xl p-3.5 shadow-sm transition active:bg-slate-50 ${
        isActive ? "bg-white ring-1 ring-amber-200" : "bg-white ring-1 ring-slate-100"
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        isActive ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
      }`}>
        <Package className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{o.customer.fullName}</p>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{line}</span>
        </div>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[o.status] ?? "bg-slate-100 text-slate-600"}`}>
          {STATUS_LABELS[o.status] ?? o.status}
        </span>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums text-slate-700">{"\u20B9"}{Math.round(Number(o.total))}</p>
        <ChevronRight className="mt-1 ml-auto h-4 w-4 text-slate-300" />
      </div>
    </Link>
  );
}
