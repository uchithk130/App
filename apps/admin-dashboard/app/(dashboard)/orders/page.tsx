"use client";

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Skeleton } from "@fitmeals/ui";
import { MoreHorizontal, Eye, RefreshCw, UserPlus, XCircle, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { AdminSlideOver } from "@/components/admin-slide-over";
import { AdminOrderDetailPanel, type AdminOrderDetail } from "@/components/admin-order-detail-panel";

type OrderRow = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  addressSnapshot: { line1?: string; city?: string; pincode?: string };
  customer: { fullName: string };
  assignment: { riderId: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  PAID: "bg-orange-50/80 text-orange-700 ring-1 ring-orange-100",
  CONFIRMED: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  PREPARING: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  READY_FOR_PICKUP: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  ASSIGNED: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  OUT_FOR_DELIVERY: "bg-orange-50 text-admin-orange ring-1 ring-orange-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  CANCELLED: "bg-slate-50 text-slate-500 line-through ring-1 ring-slate-100",
  FAILED_DELIVERY: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
  REFUNDED: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "New order",
  PAID: "New order",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready",
  ASSIGNED: "Assigned",
  OUT_FOR_DELIVERY: "On delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED_DELIVERY: "Failed",
  REFUNDED: "Refunded",
};

function statusLabel(s: string) {
  return STATUS_LABELS[s] ?? s.replaceAll("_", " ");
}

function formatAddr(a: OrderRow["addressSnapshot"]) {
  return [a.line1, a.city, a.pincode].filter(Boolean).join(", ") || "\u2014";
}

/* ── Action Menu ── */

function OrderActionMenu({
  order,
  onStatusUpdated,
  onViewOrder,
}: {
  order: OrderRow;
  onStatusUpdated: () => void;
  onViewOrder: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{ msg: string; ok: boolean } | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  // Fetch allowed statuses when opening the status panel
  const nextQ = useQuery({
    queryKey: ["admin-order-next-status", order.id, order.status],
    queryFn: () =>
      api<{ currentStatus: string; allowedStatuses: string[] }>(
        `/api/v1/admin/orders/${order.id}/status`
      ),
    enabled: statusOpen,
    staleTime: 10_000,
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) =>
      api(`/api/v1/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_data, status) => {
      setToast({ msg: `Status updated to ${statusLabel(status)}`, ok: true });
      setMenuOpen(false);
      setStatusOpen(false);
      onStatusUpdated();
    },
    onError: (err: Error) => {
      setToast({ msg: err.message, ok: false });
    },
  });

  // Auto-hide toast
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => { setMenuOpen((o) => !o); setStatusOpen(false); }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label="Actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <div className="absolute right-0 top-9 z-50 w-52 rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-slate-200">
          {/* View Order */}
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => { setMenuOpen(false); onViewOrder(); }}
          >
            <Eye className="h-4 w-4 text-slate-400" />
            View Order
          </button>

          {/* Update Status */}
          <button
            type="button"
            onClick={() => setStatusOpen((o) => !o)}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4 text-slate-400" />
            Update Status
            <ChevronRight className={`ml-auto h-3.5 w-3.5 text-slate-400 transition ${statusOpen ? "rotate-90" : ""}`} />
          </button>

          {/* Status sub-menu */}
          {statusOpen && (
            <div className="mx-2 mb-1 mt-0.5 rounded-lg bg-slate-50 p-2">
              <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Current: {statusLabel(order.status)}
              </p>
              {nextQ.isLoading && (
                <p className="px-1 py-2 text-xs text-slate-400">Loading...</p>
              )}
              {nextQ.data && nextQ.data.allowedStatuses.length === 0 && (
                <p className="px-1 py-2 text-xs text-slate-400">No admin transitions available</p>
              )}
              {nextQ.data?.allowedStatuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate(s)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:bg-white hover:shadow-sm disabled:opacity-50"
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${STATUS_STYLES[s]?.includes("emerald") ? "bg-emerald-500" : STATUS_STYLES[s]?.includes("rose") ? "bg-rose-500" : STATUS_STYLES[s]?.includes("violet") ? "bg-violet-500" : STATUS_STYLES[s]?.includes("sky") ? "bg-sky-500" : "bg-slate-400"}`}
                  />
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          )}

          {/* Assign Rider */}
          <Link
            href="/delivery"
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => setMenuOpen(false)}
          >
            <UserPlus className="h-4 w-4 text-slate-400" />
            Assign Rider
          </Link>

          {/* Cancel */}
          {!["CANCELLED", "DELIVERED", "REFUNDED"].includes(order.status) && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate("CANCELLED")}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </button>
            </>
          )}
        </div>
      )}

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

/* ── Main Page ── */

export default function AdminOrdersPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [ready, setReady] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [period, setPeriod] = React.useState<"all" | "today">("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setReady(true);
  }, [router]);

  const orders = useQuery({
    queryKey: ["admin-orders-list", statusFilter],
    queryFn: () => {
      const q = statusFilter ? `?limit=80&status=${encodeURIComponent(statusFilter)}` : "?limit=80";
      return api<{ items: OrderRow[] }>(`/api/v1/admin/orders${q}`);
    },
    enabled: ready && !!getAccessToken(),
  });

  const items = orders.data?.items ?? [];
  const startOfToday = React.useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  }, []);

  const filtered = React.useMemo(() => {
    let rows = items;
    if (period === "today") {
      rows = rows.filter((o) => new Date(o.createdAt).getTime() >= startOfToday);
    }
    return rows;
  }, [items, period, startOfToday]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const slice = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, period]);

  /* Slide-over panel state */
  const [panelOrderId, setPanelOrderId] = React.useState<string | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);

  const orderDetail = useQuery({
    queryKey: ["admin-order-detail", panelOrderId],
    queryFn: () => api<AdminOrderDetail>(`/api/v1/admin/orders/${panelOrderId}`),
    enabled: !!panelOrderId && panelOpen && !!getAccessToken(),
  });

  const openOrderPanel = (id: string) => {
    setPanelOrderId(id);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setPanelOrderId(null), 200);
  };

  const handleStatusUpdated = () => {
    void qc.invalidateQueries({ queryKey: ["admin-orders-list"] });
    void qc.invalidateQueries({ queryKey: ["admin-orders-assignable"] });
    void qc.invalidateQueries({ queryKey: ["admin-riders-free"] });
    void qc.invalidateQueries({ queryKey: ["admin-delivery-active"] });
    void qc.invalidateQueries({ queryKey: ["admin-delivery-summary"] });
    if (panelOrderId) void qc.invalidateQueries({ queryKey: ["admin-order-detail", panelOrderId] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">Here is your order list data.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-full border-0 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
          >
            <option value="">All status</option>
            <option value="PENDING_PAYMENT,PAID,CONFIRMED">New / confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY_FOR_PICKUP">Ready for pickup</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="OUT_FOR_DELIVERY">On delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "all" | "today")}
            className="h-11 rounded-full border-0 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
          >
            <option value="all">All dates</option>
            <option value="today">Today</option>
          </select>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/delivery">Assign rider</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : orders.isError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-red-600">
                    {(orders.error as Error).message}
                  </td>
                </tr>
              ) : slice.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                slice.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-semibold text-slate-900">#{o.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(o.createdAt).toLocaleString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{o.customer.fullName}</td>
                    <td className="max-w-[220px] px-6 py-4 text-slate-600">
                      <span className="line-clamp-2">{formatAddr(o.addressSnapshot)}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold tabular-nums text-slate-900">{"\u20b9"}{Number(o.total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[o.status] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {o.status === "OUT_FOR_DELIVERY" ? <span className="h-1.5 w-1.5 rounded-full bg-admin-orange" /> : null}
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <OrderActionMenu order={o} onStatusUpdated={handleStatusUpdated} onViewOrder={() => openOrderPanel(o.id)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (pageSafe - 1) * pageSize + 1} to {Math.min(pageSafe * pageSize, filtered.length)} of {filtered.length}{" "}
            entries
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full px-4 py-2 font-medium text-admin-orange disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-9 w-9 rounded-full text-sm font-semibold ${
                  p === pageSafe ? "bg-admin-orange text-white" : "text-slate-600 hover:bg-orange-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-full px-4 py-2 font-medium text-admin-orange disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AdminSlideOver open={panelOpen} onClose={closePanel} title="Order Details">
        {!panelOrderId ? null : orderDetail.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : orderDetail.isError ? (
          <p className="text-sm text-red-600">{(orderDetail.error as Error).message}</p>
        ) : orderDetail.data ? (
          <AdminOrderDetailPanel data={orderDetail.data} />
        ) : null}
      </AdminSlideOver>
    </div>
  );
}
