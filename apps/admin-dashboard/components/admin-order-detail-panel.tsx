"use client";

import * as React from "react";
import {
  Check,
  Clock,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";

/* ?? Types ?? */

export type AdminOrderDetail = {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  subtotal: string;
  deliveryFee: string;
  tax: string;
  discount: string;
  total: string;
  addressSnapshot: Record<string, unknown>;
  zoneName: string;
  slotLabel: string | null;
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    deliveryNotes: string | null;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: string;
    mealName: string;
    mealSlug: string;
  }[];
  payment: {
    method: string;
    status: string;
    amount: string;
    paidAt: string | null;
  } | null;
  rider: {
    id: string;
    fullName: string;
    vehicleType: string | null;
    vehicleNumber: string | null;
    phone: string | null;
    assignedAt: string;
  } | null;
  statusLogs: {
    status: string;
    note: string | null;
    createdAt: string;
  }[];
};

/* ?? Helpers ?? */

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800",
  PAID: "bg-orange-50 text-orange-700",
  CONFIRMED: "bg-slate-100 text-slate-700",
  PREPARING: "bg-violet-50 text-violet-700",
  READY_FOR_PICKUP: "bg-sky-50 text-sky-700",
  ASSIGNED: "bg-indigo-50 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-orange-50 text-orange-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-slate-50 text-slate-500",
  FAILED_DELIVERY: "bg-rose-50 text-rose-600",
  REFUNDED: "bg-amber-50 text-amber-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for Pickup",
  ASSIGNED: "Assigned",
  OUT_FOR_DELIVERY: "On Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED_DELIVERY: "Failed",
  REFUNDED: "Refunded",
};

function statusLabel(s: string) {
  return STATUS_LABELS[s] ?? s.replaceAll("_", " ");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtMoney(s: string) {
  return `\u20b9${Number(s).toFixed(2)}`;
}

function formatAddr(a: Record<string, unknown>) {
  return [a.line1, a.city, a.pincode].filter(Boolean).join(", ") || "\u2014";
}

/* ?? Reusable sub-components ?? */

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </h3>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-slate-50 py-1.5 last:border-0">
      <span className="shrink-0 text-xs text-slate-500">{label}</span>
      <span className="text-right text-xs font-medium text-slate-800">{value}</span>
    </div>
  );
}

/* ?? Main Panel ?? */

export function AdminOrderDetailPanel({ data }: { data: AdminOrderDetail }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-slate-900">#{data.id.slice(0, 8)}</p>
          <p className="mt-0.5 text-xs text-slate-400">{fmtDateTime(data.createdAt)}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[data.status] ?? "bg-slate-100 text-slate-700"}`}
        >
          {statusLabel(data.status)}
        </span>
      </div>

      {/* Amount card */}
      <div className="rounded-xl bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400">Total</p>
            <p className="text-xl font-bold tabular-nums text-slate-900">{fmtMoney(data.total)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400">Payment</p>
            <p className="text-sm font-semibold text-slate-700">
              {data.payment?.method ?? "\u2014"}
              <span className="ml-1 text-xs font-normal text-slate-400">{data.payment?.status ?? ""}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Customer */}
      <section>
        <SectionTitle icon={User}>Customer</SectionTitle>
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <p className="text-sm font-semibold text-slate-800">{data.customer.fullName}</p>
          <p className="mt-0.5 text-xs text-slate-500">{data.customer.email}</p>
          {data.customer.phone && (
            <a href={`tel:${data.customer.phone}`} className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
              <Phone className="h-3 w-3" />
              {data.customer.phone}
            </a>
          )}
          {data.customer.deliveryNotes && (
            <p className="mt-1.5 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
              Note: {data.customer.deliveryNotes}
            </p>
          )}
        </div>
      </section>

      {/* Delivery address */}
      <section>
        <SectionTitle icon={MapPin}>Delivery Address</SectionTitle>
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <p className="text-sm text-slate-700">{formatAddr(data.addressSnapshot)}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {data.zoneName}
            </span>
            {data.slotLabel && (
              <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {data.slotLabel}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Rider */}
      {data.rider && (
        <section>
          <SectionTitle icon={Truck}>Assigned Rider</SectionTitle>
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
              {data.rider.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">{data.rider.fullName}</p>
              <p className="text-[11px] text-slate-400">
                {data.rider.vehicleNumber ?? "No vehicle"}
                {data.rider.vehicleType ? ` \u00b7 ${data.rider.vehicleType}` : ""}
              </p>
            </div>
            {data.rider.phone && (
              <a
                href={`tel:${data.rider.phone}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                aria-label="Call rider"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </section>
      )}

      {/* Order items */}
      <section>
        <SectionTitle icon={ShoppingBag}>Items ({data.items.length})</SectionTitle>
        <div className="divide-y divide-slate-50 rounded-xl border border-slate-100 bg-white">
          {data.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{item.mealName}</p>
                <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
                {fmtMoney(item.unitPrice)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Totals */}
      <section>
        <SectionTitle icon={CreditCard}>Price Breakdown</SectionTitle>
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <InfoRow label="Subtotal" value={fmtMoney(data.subtotal)} />
          <InfoRow label="Delivery Fee" value={fmtMoney(data.deliveryFee)} />
          <InfoRow label="Tax" value={fmtMoney(data.tax)} />
          {Number(data.discount) > 0 && (
            <InfoRow label="Discount" value={`-${fmtMoney(data.discount)}`} />
          )}
          <div className="mt-1 flex justify-between border-t border-slate-100 pt-2">
            <span className="text-xs font-bold text-slate-700">Total</span>
            <span className="text-sm font-bold tabular-nums text-slate-900">{fmtMoney(data.total)}</span>
          </div>
        </div>
      </section>

      {/* Status timeline */}
      <section>
        <SectionTitle icon={Clock}>Status Timeline</SectionTitle>
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          {data.statusLogs.length === 0 ? (
            <p className="text-xs text-slate-400">No status history recorded.</p>
          ) : (
            <div className="space-y-0">
              {data.statusLogs.map((log, i) => (
                <div key={`${log.status}-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                    </div>
                    {i < data.statusLogs.length - 1 && (
                      <div className="w-0.5 flex-1 bg-emerald-200" style={{ minHeight: "1rem" }} />
                    )}
                  </div>
                  <div className="pb-3 pt-0.5">
                    <p className="text-xs font-semibold text-slate-700">{statusLabel(log.status)}</p>
                    <p className="text-[10px] text-slate-400">{fmtDateTime(log.createdAt)}</p>
                    {log.note && (
                      <p className="mt-0.5 text-[10px] text-slate-400 italic">{log.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Meta */}
      <div className="rounded-xl bg-slate-50 p-3">
        <InfoRow label="Order ID" value={data.id} />
        <InfoRow label="Type" value={data.type.replaceAll("_", " ")} />
        <InfoRow label="Created" value={fmtDateTime(data.createdAt)} />
        <InfoRow label="Last Updated" value={fmtDateTime(data.updatedAt)} />
        {data.payment?.paidAt && <InfoRow label="Paid At" value={fmtDateTime(data.payment.paidAt)} />}
        {data.rider?.assignedAt && <InfoRow label="Rider Assigned" value={fmtDateTime(data.rider.assignedAt)} />}
      </div>
    </div>
  );
}
