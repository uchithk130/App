"use client";

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import {
  Package,
  UserCircle2,
  Truck,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  Phone,
  ChevronRight,
  AlertCircle,
  Map,
} from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { DeliveryMap, type DeliveryMarker } from "@/components/delivery/delivery-map";

/* ── All query keys used by this page ── */
const QK = {
  summary: ["admin-delivery-summary"],
  assignable: ["admin-orders-assignable"],
  freeRiders: ["admin-riders-free"],
  active: ["admin-delivery-active"],
  ordersList: ["admin-orders-list"],
} as const;

/* ── Types ── */
type Summary = {
  unassignedOrders: number;
  readyForPickup: number;
  assignedOrders: number;
  onTheWay: number;
  deliveredToday: number;
  ridersAvailable: number;
  ridersBusy: number;
};

type AssignableOrder = {
  id: string;
  status: string;
  createdAt: string;
  total: string;
  customerName: string;
  currentRiderName: string | null;
  currentRiderId: string | null;
  zoneName: string;
  address: Record<string, unknown>;
};

type FreeRider = {
  id: string;
  fullName: string;
  availability: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
};

type ActiveDelivery = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  address: Record<string, unknown>;
  destination: { lat: number; lng: number } | null;
  rider: {
    id: string;
    name: string;
    vehicleType: string | null;
    vehicleNumber: string | null;
    phone: string | null;
    assignedAt: string;
    location: { lat: number; lng: number; updatedAt: string | null } | null;
  } | null;
  lastStatusAt: string;
};

/* ── Status helpers ── */
const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  PAID: { label: "New", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  CONFIRMED: { label: "Confirmed", cls: "bg-slate-100 text-slate-700 ring-slate-200" },
  PREPARING: { label: "Preparing", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  READY_FOR_PICKUP: { label: "Ready", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  ASSIGNED: { label: "Assigned", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  OUT_FOR_DELIVERY: { label: "On the way", cls: "bg-orange-50 text-admin-orange ring-orange-200" },
};

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CHIP[status] ?? { label: status.replaceAll("_", " "), cls: "bg-slate-50 text-slate-600 ring-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function formatAddr(a: Record<string, unknown>) {
  return [a.line1, a.city, a.pincode].filter(Boolean).join(", ") || "\u2014";
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

/* ── Stat card ── */
function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptySection({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
      <div className="mb-3 text-slate-300">{icon}</div>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

/* ── Main page ── */
export default function DeliveryPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = React.useState("");
  const [selectedRiderId, setSelectedRiderId] = React.useState("");
  const [toast, setToast] = React.useState<{ msg: string; ok: boolean } | null>(null);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setMounted(true);
  }, [router]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const enabled = mounted && !!getAccessToken();

  const summary = useQuery({
    queryKey: QK.summary,
    queryFn: () => api<Summary>("/api/v1/admin/delivery/summary"),
    enabled,
    refetchInterval: 30_000,
  });

  const orders = useQuery({
    queryKey: QK.assignable,
    queryFn: () => api<{ items: AssignableOrder[] }>("/api/v1/admin/orders/assignable?limit=80"),
    enabled,
  });

  const riders = useQuery({
    queryKey: QK.freeRiders,
    queryFn: () => api<{ items: FreeRider[] }>("/api/v1/admin/riders/free"),
    enabled,
  });

  const active = useQuery({
    queryKey: QK.active,
    queryFn: () => api<{ items: ActiveDelivery[] }>("/api/v1/admin/delivery/active"),
    enabled,
    refetchInterval: 15_000,
  });

  // Auto-select first order/rider
  React.useEffect(() => {
    if (!selectedOrderId && orders.data?.items.length) setSelectedOrderId(orders.data.items[0]!.id);
  }, [orders.data, selectedOrderId]);

  React.useEffect(() => {
    if (!selectedRiderId && riders.data?.items.length) setSelectedRiderId(riders.data.items[0]!.id);
  }, [riders.data, selectedRiderId]);

  const assignMutation = useMutation({
    mutationFn: () =>
      api(`/api/v1/admin/orders/${selectedOrderId}/assign-rider`, {
        method: "POST",
        body: JSON.stringify({ riderProfileId: selectedRiderId }),
      }),
    onSuccess: () => {
      setToast({ msg: "Rider assigned successfully", ok: true });
      setSelectedOrderId("");
      setSelectedRiderId("");
      // Invalidate ALL dependent queries
      void qc.invalidateQueries({ queryKey: QK.assignable });
      void qc.invalidateQueries({ queryKey: QK.freeRiders });
      void qc.invalidateQueries({ queryKey: QK.active });
      void qc.invalidateQueries({ queryKey: QK.summary });
      void qc.invalidateQueries({ queryKey: QK.ordersList });
    },
    onError: (e: Error) => {
      setToast({ msg: e.message, ok: false });
    },
  });

  const s = summary.data;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Delivery &amp; Rider Assignment</h1>
        <p className="text-sm text-slate-500">Manage deliveries and assign riders to orders.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {summary.isLoading ? (
          Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
        ) : s ? (
          <>
            <StatCard icon={<Package className="h-5 w-5 text-amber-600" />} label="Unassigned" value={s.unassignedOrders} accent="bg-amber-50" />
            <StatCard icon={<Clock className="h-5 w-5 text-sky-600" />} label="Ready" value={s.readyForPickup} accent="bg-sky-50" />
            <StatCard icon={<UserCircle2 className="h-5 w-5 text-indigo-600" />} label="Assigned" value={s.assignedOrders} accent="bg-indigo-50" />
            <StatCard icon={<Truck className="h-5 w-5 text-admin-orange" />} label="On the way" value={s.onTheWay} accent="bg-orange-50" />
            <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} label="Delivered today" value={s.deliveredToday} accent="bg-emerald-50" />
            <StatCard icon={<Users className="h-5 w-5 text-emerald-600" />} label="Riders free" value={s.ridersAvailable} accent="bg-emerald-50" />
            <StatCard icon={<Users className="h-5 w-5 text-rose-500" />} label="Riders busy" value={s.ridersBusy} accent="bg-rose-50" />
          </>
        ) : null}
      </div>

      {/* Assignment workspace */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-4 text-base font-bold text-slate-900">Assign Rider to Order</h2>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          {/* Order select */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Package className="h-3.5 w-3.5" /> Order
            </label>
            {orders.isLoading ? (
              <Skeleton className="h-11 w-full rounded-lg" />
            ) : (
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-admin-orange focus:outline-none focus:ring-2 focus:ring-admin-orange/20"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
              >
                <option value="">Select order...</option>
                {orders.data?.items.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id.slice(0, 8)} \u00b7 {o.customerName} \u00b7 {STATUS_CHIP[o.status]?.label ?? o.status} \u00b7 {o.zoneName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Rider select */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <UserCircle2 className="h-3.5 w-3.5" /> Rider
            </label>
            {riders.isLoading ? (
              <Skeleton className="h-11 w-full rounded-lg" />
            ) : (
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-admin-orange focus:outline-none focus:ring-2 focus:ring-admin-orange/20"
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(e.target.value)}
              >
                <option value="">Select rider...</option>
                {riders.data?.items.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.fullName}{r.vehicleNumber ? ` \u00b7 ${r.vehicleNumber}` : ""} \u00b7 {r.availability}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Assign button */}
          <div className="flex items-end">
            <button
              type="button"
              disabled={!selectedOrderId || !selectedRiderId || assignMutation.isPending}
              onClick={() => assignMutation.mutate()}
              className="h-11 rounded-lg bg-admin-orange px-6 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-40"
            >
              {assignMutation.isPending ? "Assigning..." : "Assign Rider"}
            </button>
          </div>
        </div>

        {/* No riders warning */}
        {!riders.isLoading && (riders.data?.items.length ?? 0) === 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            No free approved riders available right now.
          </div>
        )}
      </div>

      {/* Live delivery map */}
      {(active.data?.items.length ?? 0) > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center gap-2">
            <Map className="h-4 w-4 text-admin-orange" />
            <h2 className="text-sm font-bold text-slate-900">Live Delivery Map</h2>
            <span className="ml-auto text-[10px] text-slate-400">Updates every 15s</span>
          </div>
          <DeliveryMap
            deliveries={(active.data?.items ?? []).map(
              (d): DeliveryMarker => ({
                id: d.id,
                customerName: d.customerName,
                riderName: d.rider?.name ?? "Unknown",
                status: d.status,
                destination: d.destination,
                riderLocation: d.rider?.location
                  ? { lat: d.rider.location.lat, lng: d.rider.location.lng }
                  : null,
              })
            )}
          />
        </div>
      )}

      {/* Three-column layout: assignable orders, free riders, active deliveries */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Assignable orders */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h3 className="text-sm font-bold text-slate-900">Assignable Orders</h3>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {orders.data?.items.length ?? 0}
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-3">
            {orders.isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            )}
            {!orders.isLoading && (orders.data?.items.length ?? 0) === 0 && (
              <EmptySection
                icon={<Package className="h-10 w-10" />}
                title="No assignable orders"
                subtitle="All orders are assigned or no new orders."
              />
            )}
            {orders.data?.items.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedOrderId(o.id)}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                  selectedOrderId === o.id
                    ? "bg-orange-50 ring-2 ring-admin-orange/30"
                    : "hover:bg-slate-50 ring-1 ring-slate-100"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs font-bold text-slate-500">
                  #{o.id.slice(0, 4)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{o.customerName}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <StatusChip status={o.status} />
                    <span className="truncate text-[11px] text-slate-400">{o.zoneName}</span>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-bold tabular-nums text-slate-700">{"\u20b9"}{Number(o.total).toFixed(0)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Free riders */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h3 className="text-sm font-bold text-slate-900">Available Riders</h3>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {riders.data?.items.length ?? 0}
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-3">
            {riders.isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            )}
            {!riders.isLoading && (riders.data?.items.length ?? 0) === 0 && (
              <EmptySection
                icon={<Users className="h-10 w-10" />}
                title="No riders available"
                subtitle="All approved riders are currently on deliveries."
              />
            )}
            {riders.data?.items.map((r) => {
              const initials = r.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRiderId(r.id)}
                  className={`mb-2 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                    selectedRiderId === r.id
                      ? "bg-orange-50 ring-2 ring-admin-orange/30"
                      : "hover:bg-slate-50 ring-1 ring-slate-100"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{r.fullName}</p>
                    <p className="text-[11px] text-slate-400">
                      {r.vehicleNumber ?? "No vehicle"} \u00b7 {r.availability}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Active deliveries */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h3 className="text-sm font-bold text-slate-900">Active Deliveries</h3>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
              {active.data?.items.length ?? 0}
            </span>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-3">
            {active.isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            )}
            {!active.isLoading && (active.data?.items.length ?? 0) === 0 && (
              <EmptySection
                icon={<Truck className="h-10 w-10" />}
                title="No active deliveries"
                subtitle="Assign a rider to start a delivery."
              />
            )}
            {active.data?.items.map((d) => (
              <div
                key={d.id}
                className="mb-2 rounded-xl p-3 ring-1 ring-slate-100"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">#{d.id.slice(0, 8)}</span>
                  <StatusChip status={d.status} />
                </div>
                <p className="truncate text-sm font-semibold text-slate-900">{d.customerName}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{formatAddr(d.address)}</span>
                </div>
                {d.rider && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700">
                      {d.rider.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-700">{d.rider.name}</p>
                      <p className="text-[10px] text-slate-400">{timeAgo(d.rider.assignedAt)}</p>
                    </div>
                    {d.rider.phone && (
                      <a
                        href={`tel:${d.rider.phone}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                        aria-label="Call rider"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] rounded-xl px-5 py-3 text-sm font-medium shadow-lg ${
            toast.ok ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
