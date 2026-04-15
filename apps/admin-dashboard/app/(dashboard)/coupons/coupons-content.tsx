"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Loader2, Pencil, Plus } from "lucide-react";
import { Button, ToggleSwitch } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type CouponRow = {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  percentOff: string | null;
  amountOff: string | null;
  freeShipping: boolean;
  maxDiscount: string | null;
  minOrderAmount: string | null;
  maxUses: number | null;
  perUserLimit: number | null;
  usedCount: number;
  validFrom: string | null;
  expiresAt: string | null;
  isActive: boolean;
  firstOrderOnly: boolean;
  appliesToAllCustomers: boolean;
  appliesToAllMeals: boolean;
  customerIds: string[];
  mealIds: string[];
  termsAndConditions: string | null;
  displayBadge: string | null;
  sortOrder: number;
};

type CustomerOpt = { id: string; fullName: string; email: string };
type MealOpt = { id: string; name: string };

function formatScope(all: boolean, count: number, label: string) {
  if (all) return `All ${label}`;
  return count === 0 ? `No ${label}` : `${count} ${label}`;
}

export function CouponsContent() {
  const qc = useQueryClient();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const couponsQ = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => api<{ items: CouponRow[] }>("/api/v1/admin/coupons?limit=120"),
    enabled: mounted && !!getAccessToken(),
  });

  const customersQ = useQuery({
    queryKey: ["admin-customers-options"],
    queryFn: () => api<{ items: CustomerOpt[] }>("/api/v1/admin/customers"),
    enabled: mounted && !!getAccessToken(),
  });

  const mealsQ = useQuery({
    queryKey: ["admin-meal-options"],
    queryFn: () => api<{ items: MealOpt[] }>("/api/v1/admin/meal-options"),
    enabled: mounted && !!getAccessToken(),
  });

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [discountKind, setDiscountKind] = React.useState<"percent" | "amount">("percent");
  const [discountValue, setDiscountValue] = React.useState("");
  const [freeShipping, setFreeShipping] = React.useState(false);
  const [maxDiscount, setMaxDiscount] = React.useState("");
  const [minOrderAmount, setMinOrderAmount] = React.useState("");
  const [maxUses, setMaxUses] = React.useState("");
  const [perUserLimit, setPerUserLimit] = React.useState("");
  const [validFrom, setValidFrom] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [firstOrderOnly, setFirstOrderOnly] = React.useState(false);
  const [appliesToAllCustomers, setAppliesToAllCustomers] = React.useState(true);
  const [selectedCustomerIds, setSelectedCustomerIds] = React.useState<string[]>([]);
  const [appliesToAllMeals, setAppliesToAllMeals] = React.useState(true);
  const [selectedMealIds, setSelectedMealIds] = React.useState<string[]>([]);
  const [termsAndConditions, setTermsAndConditions] = React.useState("");
  const [displayBadge, setDisplayBadge] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState("");

  function loadRow(row: CouponRow) {
    setEditingId(row.id);
    setCode(row.code);
    setTitle(row.title ?? "");
    setDescription(row.description ?? "");
    if (row.percentOff) {
      setDiscountKind("percent");
      setDiscountValue(row.percentOff);
    } else {
      setDiscountKind("amount");
      setDiscountValue(row.amountOff ?? "");
    }
    setFreeShipping(row.freeShipping);
    setMaxDiscount(row.maxDiscount ?? "");
    setMinOrderAmount(row.minOrderAmount ?? "");
    setMaxUses(row.maxUses != null ? String(row.maxUses) : "");
    setPerUserLimit(row.perUserLimit != null ? String(row.perUserLimit) : "");
    setValidFrom(row.validFrom ? row.validFrom.slice(0, 16) : "");
    setExpiresAt(row.expiresAt ? row.expiresAt.slice(0, 16) : "");
    setFirstOrderOnly(row.firstOrderOnly);
    setAppliesToAllCustomers(row.appliesToAllCustomers);
    setSelectedCustomerIds(row.customerIds);
    setAppliesToAllMeals(row.appliesToAllMeals);
    setSelectedMealIds(row.mealIds);
    setTermsAndConditions(row.termsAndConditions ?? "");
    setDisplayBadge(row.displayBadge ?? "");
    setSortOrder(row.sortOrder != null ? String(row.sortOrder) : "");
  }

  function resetForm() {
    setEditingId(null);
    setCode("");
    setTitle("");
    setDescription("");
    setDiscountKind("percent");
    setDiscountValue("");
    setFreeShipping(false);
    setMaxDiscount("");
    setMinOrderAmount("");
    setMaxUses("");
    setPerUserLimit("");
    setValidFrom("");
    setExpiresAt("");
    setFirstOrderOnly(false);
    setAppliesToAllCustomers(true);
    setSelectedCustomerIds([]);
    setAppliesToAllMeals(true);
    setSelectedMealIds([]);
    setTermsAndConditions("");
    setDisplayBadge("");
    setSortOrder("");
  }

  const save = useMutation({
    mutationFn: async () => {
      const percentOff = discountKind === "percent" && discountValue.trim() ? discountValue.trim() : null;
      const amountOff = discountKind === "amount" && discountValue.trim() ? discountValue.trim() : null;
      const body = {
        code: code.trim(),
        title: title.trim() || null,
        description: description.trim() || null,
        percentOff,
        amountOff,
        freeShipping,
        maxDiscount: maxDiscount.trim() ? maxDiscount.trim() : null,
        minOrderAmount: minOrderAmount.trim() ? minOrderAmount.trim() : null,
        maxUses: maxUses.trim() ? Number(maxUses) : null,
        perUserLimit: perUserLimit.trim() ? Number(perUserLimit) : null,
        validFrom: validFrom ? new Date(validFrom).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive: true,
        firstOrderOnly,
        appliesToAllCustomers,
        customerIds: appliesToAllCustomers ? [] : selectedCustomerIds,
        appliesToAllMeals,
        mealIds: appliesToAllMeals ? [] : selectedMealIds,
        termsAndConditions: termsAndConditions.trim() || null,
        displayBadge: displayBadge.trim() || null,
        sortOrder: sortOrder.trim() ? Number(sortOrder) : 0,
      };
      if (editingId) {
        return api<CouponRow>(`/api/v1/admin/coupons/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...body,
            customerIds: appliesToAllCustomers ? [] : selectedCustomerIds,
            mealIds: appliesToAllMeals ? [] : selectedMealIds,
          }),
        });
      }
      return api<CouponRow>("/api/v1/admin/coupons", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      void qc.invalidateQueries({ queryKey: ["admin-coupons-header"] });
      resetForm();
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api<CouponRow>(`/api/v1/admin/coupons/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      void qc.invalidateQueries({ queryKey: ["admin-coupons-header"] });
    },
  });

  const customers = customersQ.data?.items ?? [];
  const meals = mealsQ.data?.items ?? [];
  const rows = couponsQ.data?.items ?? [];

  function onCustomerSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSelectedCustomerIds(selected);
  }

  function onMealSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSelectedMealIds(selected);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3 text-sm text-slate-700">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-admin-orange" aria-hidden />
        <p>
          Create coupon codes for customers. Choose <strong>all customers</strong> or specific accounts, and{" "}
          <strong>all meals</strong> or specific menu items. Turn coupons off anytime with the active toggle — inactive
          codes cannot be applied at checkout.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">{editingId ? "Edit coupon" : "New coupon"}</h2>
          {editingId ? (
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </div>

        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Code</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-slate-200 bg-admin-canvas/40 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-admin-orange/25"
              placeholder="E.g. WELCOME10"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
              placeholder="E.g. Free Shipping, 20% Off"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
              placeholder="Shown to customers when the coupon applies"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Discount</span>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dk"
                  checked={discountKind === "percent"}
                  onChange={() => setDiscountKind("percent")}
                />
                Percent off
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dk"
                  checked={discountKind === "amount"}
                  onChange={() => setDiscountKind("amount")}
                />
                Fixed amount (INR)
              </label>
            </div>
            <input
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              type="number"
              min="0.01"
              step="any"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
              placeholder={discountKind === "percent" ? "e.g. 15" : "e.g. 100"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max uses (optional)</label>
            <input
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              type="number"
              min="1"
              step="1"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
              placeholder="Unlimited if empty"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expires (optional)</label>
            <input
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              type="datetime-local"
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max discount cap (optional)</label>
            <input
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              type="number"
              min="0"
              step="any"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
              placeholder="No cap if empty"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min order amount (optional)</label>
            <input
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              type="number"
              min="0"
              step="any"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
              placeholder="No minimum if empty"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Per-user limit (optional)</label>
            <input
              value={perUserLimit}
              onChange={(e) => setPerUserLimit(e.target.value)}
              type="number"
              min="1"
              step="1"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
              placeholder="Unlimited if empty"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Valid from (optional)</label>
            <input
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              type="datetime-local"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Display badge (optional)</label>
            <input
              value={displayBadge}
              onChange={(e) => setDisplayBadge(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
              placeholder="E.g. BEST VALUE"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort order</label>
            <input
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              type="number"
              min="0"
              step="1"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
              placeholder="0"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <input type="checkbox" checked={freeShipping} onChange={(e) => setFreeShipping(e.target.checked)} />
                Free shipping
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <input type="checkbox" checked={firstOrderOnly} onChange={(e) => setFirstOrderOnly(e.target.checked)} />
                First order only
              </label>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Terms & Conditions (optional)</label>
            <textarea
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
              placeholder="Enter terms and conditions"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={appliesToAllCustomers}
                onChange={(e) => {
                  setAppliesToAllCustomers(e.target.checked);
                  if (e.target.checked) setSelectedCustomerIds([]);
                }}
              />
              All customers
            </label>
            {!appliesToAllCustomers ? (
              <div>
                <p className="mb-1 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple</p>
                <select
                  multiple
                  size={6}
                  value={selectedCustomerIds}
                  onChange={onCustomerSelect}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={appliesToAllMeals}
                onChange={(e) => {
                  setAppliesToAllMeals(e.target.checked);
                  if (e.target.checked) setSelectedMealIds([]);
                }}
              />
              All menu items
            </label>
            {!appliesToAllMeals ? (
              <div>
                <p className="mb-1 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple</p>
                <select
                  multiple
                  size={8}
                  value={selectedMealIds}
                  onChange={onMealSelect}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-admin-orange/25"
                >
                  {meals.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="md:col-span-2">
            {save.isError ? (
              <p className="mb-2 text-sm text-red-600">{(save.error as Error).message}</p>
            ) : null}
            <Button
              type="submit"
              disabled={save.isPending}
              className="rounded-full bg-admin-orange hover:bg-admin-orange/90"
            >
              {save.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editingId ? (
                "Update coupon"
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create coupon
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">All coupons</h2>
          <p className="text-sm text-slate-500">Toggle active to control checkout visibility.</p>
        </div>
        {couponsQ.isLoading ? (
          <div className="flex items-center gap-2 p-8 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : couponsQ.isError ? (
          <p className="p-8 text-sm text-red-600">{(couponsQ.error as Error).message}</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-sm text-slate-500">No coupons yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-admin-canvas/40 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Customers</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Uses</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{row.code}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.percentOff ? `${row.percentOff}%` : row.amountOff ? `₹${row.amountOff}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatScope(row.appliesToAllCustomers, row.customerIds.length, "customers")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatScope(row.appliesToAllMeals, row.mealIds.length, "meals")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.usedCount}
                      {row.maxUses != null ? ` / ${row.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <ToggleSwitch
                        checked={row.isActive}
                        onChange={() => toggleActive.mutate({ id: row.id, isActive: !row.isActive })}
                        disabled={toggleActive.isPending}
                        label="Active"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => loadRow(row)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
