"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { Button, Input, Label, Skeleton, Card, CardContent, CardHeader, CardTitle } from "@fitmeals/ui";
import { api } from "@/lib/api";

type Zone = {
  id: string;
  name: string;
  isActive: boolean;
  baseDeliveryFee: string;
  minOrderAmount: string;
  taxRatePercent: string | null;
  pincodes: string[];
  orderCount: number;
  createdAt: string;
};

type FormState = {
  name: string;
  baseDeliveryFee: string;
  minOrderAmount: string;
  taxRatePercent: string;
  pincodes: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  baseDeliveryFee: "",
  minOrderAmount: "",
  taxRatePercent: "",
  pincodes: "",
  isActive: true,
};

export default function ZonesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [formErr, setFormErr] = React.useState<string | null>(null);

  const zonesQ = useQuery({
    queryKey: ["admin-zones"],
    queryFn: () => api<{ items: Zone[] }>("/api/v1/admin/zones"),
  });

  const createZone = useMutation({
    mutationFn: (data: object) =>
      api("/api/v1/admin/zones", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-zones"] });
      setCreating(false);
      setForm(emptyForm);
      setFormErr(null);
    },
  });

  const updateZone = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api(`/api/v1/admin/zones/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-zones"] });
      setEditing(null);
      setForm(emptyForm);
      setFormErr(null);
    },
  });

  const deleteZone = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/admin/zones/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-zones"] }),
  });

  const zones = zonesQ.data?.items ?? [];

  function parsePincodes(raw: string) {
    return raw
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function handleSubmit() {
    setFormErr(null);
    if (!form.name.trim()) { setFormErr("Zone name is required"); return; }
    const pincodes = parsePincodes(form.pincodes);
    if (pincodes.length === 0) { setFormErr("At least one pincode is required"); return; }
    const fee = Number(form.baseDeliveryFee);
    const min = Number(form.minOrderAmount);
    if (isNaN(fee) || fee < 0) { setFormErr("Invalid delivery fee"); return; }
    if (isNaN(min) || min < 0) { setFormErr("Invalid minimum order amount"); return; }
    const tax = form.taxRatePercent.trim() ? Number(form.taxRatePercent) : null;
    if (tax !== null && (isNaN(tax) || tax < 0 || tax > 100)) { setFormErr("Tax rate must be 0-100"); return; }

    const payload = {
      name: form.name.trim(),
      isActive: form.isActive,
      baseDeliveryFee: fee,
      minOrderAmount: min,
      taxRatePercent: tax,
      pincodes,
    };

    if (editing) {
      updateZone.mutate({ id: editing, data: payload });
    } else {
      createZone.mutate(payload);
    }
  }

  function startEdit(z: Zone) {
    setCreating(false);
    setEditing(z.id);
    setForm({
      name: z.name,
      baseDeliveryFee: z.baseDeliveryFee,
      minOrderAmount: z.minOrderAmount,
      taxRatePercent: z.taxRatePercent ?? "",
      pincodes: z.pincodes.join(", "),
      isActive: z.isActive,
    });
    setFormErr(null);
  }

  function cancelForm() {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm);
    setFormErr(null);
  }

  const showForm = creating || editing;
  const busy = createZone.isPending || updateZone.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Delivery Zones</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Manage serviceable areas, delivery fees, and minimum order amounts
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => { setEditing(null); setCreating(true); setForm(emptyForm); setFormErr(null); }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Zone
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{editing ? "Edit Zone" : "New Zone"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="zone-name">Zone name</Label>
                <Input id="zone-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Central Bengaluru" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zone-fee">Delivery fee</Label>
                <Input id="zone-fee" type="number" min={0} value={form.baseDeliveryFee} onChange={(e) => setForm({ ...form, baseDeliveryFee: e.target.value })} placeholder="49" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zone-min">Min order amount</Label>
                <Input id="zone-min" type="number" min={0} value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="299" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zone-tax">Tax rate (%)</Label>
                <Input id="zone-tax" type="number" min={0} max={100} step={0.01} value={form.taxRatePercent} onChange={(e) => setForm({ ...form, taxRatePercent: e.target.value })} placeholder="5" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zone-pins">Pincodes (comma or newline separated)</Label>
              <textarea
                id="zone-pins"
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-zinc-700 dark:bg-zinc-800"
                value={form.pincodes}
                onChange={(e) => setForm({ ...form, pincodes: e.target.value })}
                placeholder="560001, 560002, 560003"
              />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                {form.isActive
                  ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                  : <ToggleLeft className="h-6 w-6 text-slate-400" />}
              </button>
              <span className="text-sm text-slate-600 dark:text-zinc-300">{form.isActive ? "Active" : "Inactive"}</span>
            </div>
            {formErr && <p className="text-sm text-red-600">{formErr}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={busy} className="gap-1.5">
                <Check className="h-4 w-4" /> {editing ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={cancelForm} disabled={busy} className="gap-1.5">
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {zonesQ.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : zones.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 py-16 text-center dark:border-zinc-700">
          <MapPin className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">No zones yet</p>
          <p className="mt-1 text-xs text-slate-400">Create your first delivery zone to start accepting orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((z) => (
            <div
              key={z.id}
              className={`flex flex-col gap-3 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center ${
                z.isActive
                  ? "border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  : "border-slate-100 bg-slate-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{z.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${z.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {z.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
                  <span>Fee: {z.baseDeliveryFee}</span>
                  <span>Min order: {z.minOrderAmount}</span>
                  {z.taxRatePercent && <span>Tax: {z.taxRatePercent}%</span>}
                  <span>{z.orderCount} orders</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {z.pincodes.slice(0, 10).map((p) => (
                    <span key={p} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {p}
                    </span>
                  ))}
                  {z.pincodes.length > 10 && (
                    <span className="text-[10px] text-slate-400">+{z.pincodes.length - 10} more</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button variant="outline" size="sm" onClick={() => startEdit(z)} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { if (confirm("Delete this zone?")) deleteZone.mutate(z.id); }}
                  className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
