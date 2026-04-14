"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@fitmeals/ui";
import { Check, XCircle, Bike, Star, Wallet, Package, Pencil, Ban, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { AdminSlideOver } from "@/components/admin-slide-over";

type RiderRow = {
  id: string;
  fullName: string;
  availability: string;
  approvalStatus: string;
  vehicleNumber: string | null;
  vehicleType: string | null;
  createdAt: string;
};

type RiderDetail = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  availability: string;
  approvalStatus: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  kycStatus: string | null;
  bankDetails: { accountName?: string; accountNumber?: string; ifsc?: string; bankName?: string; upiId?: string } | null;
  walletBalance: string;
  walletHeld: string;
  stats: {
    ordersDelivered: number;
    lifetimeDeliveryCredits: string;
    reviewCount: number;
    reviewAvg: number | null;
  };
};

type ApprovalFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminRidersPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [ready, setReady] = React.useState(false);
  const [filter, setFilter] = React.useState<ApprovalFilter>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [actionMsg, setActionMsg] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    fullName: "",
    phone: "",
    vehicleType: "",
    vehicleNumber: "",
    kycStatus: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    upiId: "",
  });

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setReady(true);
  }, [router]);

  const listKey = filter === "all" ? "admin-riders-list-all" : `admin-riders-list-${filter}`;
  const riders = useQuery({
    queryKey: [listKey],
    queryFn: () =>
      api<{ items: RiderRow[] }>(
        filter === "all" ? "/api/v1/admin/riders" : `/api/v1/admin/riders?approval=${filter}`,
      ),
    enabled: ready && !!getAccessToken(),
  });

  const detail = useQuery({
    queryKey: ["admin-rider-detail", selectedId],
    queryFn: () => api<RiderDetail>(`/api/v1/admin/riders/${selectedId}`),
    enabled: !!selectedId && panelOpen && !!getAccessToken(),
  });

  const openProfile = (id: string) => {
    setSelectedId(id);
    setPanelOpen(true);
    setActionMsg(null);
    setEditing(false);
  };

  const startEdit = (d: RiderDetail) => {
    setEditForm({
      fullName: d.fullName,
      phone: d.phone ?? "",
      vehicleType: d.vehicleType ?? "",
      vehicleNumber: d.vehicleNumber ?? "",
      kycStatus: d.kycStatus ?? "",
      accountName: d.bankDetails?.accountName ?? "",
      accountNumber: d.bankDetails?.accountNumber ?? "",
      ifsc: d.bankDetails?.ifsc ?? "",
      bankName: d.bankDetails?.bankName ?? "",
      upiId: d.bankDetails?.upiId ?? "",
    });
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) return;
      const body: Record<string, unknown> = {
        fullName: editForm.fullName || undefined,
        phone: editForm.phone || null,
        vehicleType: editForm.vehicleType || null,
        vehicleNumber: editForm.vehicleNumber || null,
        kycStatus: editForm.kycStatus || null,
        bankDetails: {
          accountName: editForm.accountName || undefined,
          accountNumber: editForm.accountNumber || undefined,
          ifsc: editForm.ifsc || undefined,
          bankName: editForm.bankName || undefined,
          upiId: editForm.upiId || undefined,
        },
      };
      return api(`/api/v1/admin/riders/${selectedId}`, { method: "PATCH", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      setActionMsg("Saved.");
      setEditing(false);
      void qc.invalidateQueries({ queryKey: [listKey] });
      void qc.invalidateQueries({ queryKey: ["admin-rider-detail", selectedId] });
    },
    onError: (e: Error) => setActionMsg(e.message),
  });

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedId(null), 200);
  };

  const patchRider = async (status: "APPROVED" | "REJECTED" | "SUSPENDED", rejectionReason?: string) => {
    if (!selectedId) return;
    setActionMsg(null);
    try {
      await api(`/api/v1/admin/riders/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify({ approvalStatus: status, rejectionReason }),
      });
      setActionMsg(status === "APPROVED" ? "Approved." : "Rejected.");
      void qc.invalidateQueries({ queryKey: [listKey] });
      void qc.invalidateQueries({ queryKey: ["admin-rider-detail", selectedId] });
      void qc.invalidateQueries({ queryKey: ["admin-riders-free"] });
    } catch (e) {
      setActionMsg((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Riders</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Approve new partners, inspect profiles, and use the Delivery page to dispatch.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <Button
            key={f}
            type="button"
            variant={filter === f ? "default" : "outline"}
            size="sm"
            className={filter === f ? "rounded-full bg-admin-orange hover:bg-admin-orange-hover" : "rounded-full"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base">Rider roster</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {riders.isLoading ? (
            <div className="p-6">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : riders.isError ? (
            <p className="p-6 text-destructive">{(riders.error as Error).message}</p>
          ) : (
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-800/40">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Name</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Availability</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Vehicle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {riders.data?.items.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-800/30"
                    onClick={() => openProfile(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openProfile(r.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-200">{r.fullName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.approvalStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                            : r.approvalStatus === "PENDING"
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                              : "bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200"
                        }`}
                      >
                        {r.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{r.availability}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{r.vehicleNumber ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AdminSlideOver open={panelOpen} onClose={closePanel} title="Rider profile">
        {!selectedId ? null : detail.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : detail.isError ? (
          <p className="text-destructive">{(detail.error as Error).message}</p>
        ) : detail.data ? (
            <div className="space-y-6">
              {/* Header + edit toggle */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{detail.data.fullName}</p>
                  <p className="text-sm text-slate-500">{detail.data.email}</p>
                  {detail.data.phone ? <p className="text-sm text-slate-500">{detail.data.phone}</p> : null}
                </div>
                {!editing && (
                  <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => startEdit(detail.data!)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                )}
              </div>

              {/* Pending approval actions */}
              {detail.data.approvalStatus === "PENDING" ? (
                <div className="flex flex-wrap gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <p className="w-full text-sm font-medium text-amber-900 dark:text-amber-100">Pending approval</p>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1 bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => void patchRider("APPROVED")}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button type="button" size="sm" variant="destructive" className="gap-1" onClick={() => void patchRider("REJECTED")}>
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              ) : null}

              {/* Suspend button for approved riders */}
              {detail.data.approvalStatus === "APPROVED" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  onClick={() => void patchRider("SUSPENDED")}
                >
                  <Ban className="h-4 w-4" /> Suspend rider
                </Button>
              ) : null}

              {/* Re-approve suspended riders */}
              {detail.data.approvalStatus === "SUSPENDED" ? (
                <div className="flex flex-wrap gap-2 rounded-xl border border-red-200 bg-red-50/80 p-3 dark:border-red-900/50 dark:bg-red-950/30">
                  <p className="w-full text-sm font-medium text-red-900 dark:text-red-100">Account suspended</p>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1 bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => void patchRider("APPROVED")}
                  >
                    <Check className="h-4 w-4" /> Re-approve
                  </Button>
                </div>
              ) : null}

              {actionMsg ? <p className="text-sm text-slate-600 dark:text-zinc-400">{actionMsg}</p> : null}

              {/* Edit form */}
              {editing ? (
                <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-zinc-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Edit rider details</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Full name</span>
                      <input value={editForm.fullName} onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Phone</span>
                      <input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Vehicle type</span>
                      <input value={editForm.vehicleType} onChange={(e) => setEditForm((p) => ({ ...p, vehicleType: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Vehicle number</span>
                      <input value={editForm.vehicleNumber} onChange={(e) => setEditForm((p) => ({ ...p, vehicleNumber: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">KYC status</span>
                      <input value={editForm.kycStatus} onChange={(e) => setEditForm((p) => ({ ...p, kycStatus: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                        placeholder="verified / pending / rejected" />
                    </label>
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bank details</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Account name</span>
                      <input value={editForm.accountName} onChange={(e) => setEditForm((p) => ({ ...p, accountName: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Bank name</span>
                      <input value={editForm.bankName} onChange={(e) => setEditForm((p) => ({ ...p, bankName: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Account number</span>
                      <input value={editForm.accountNumber} onChange={(e) => setEditForm((p) => ({ ...p, accountNumber: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-800" />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">IFSC</span>
                      <input value={editForm.ifsc} onChange={(e) => setEditForm((p) => ({ ...p, ifsc: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-800" />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">UPI ID</span>
                      <input value={editForm.upiId} onChange={(e) => setEditForm((p) => ({ ...p, upiId: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                        placeholder="rider@upi" />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" size="sm" className="bg-admin-orange hover:bg-admin-orange-hover" disabled={saveMutation.isPending}
                      onClick={() => saveMutation.mutate()}>
                      {saveMutation.isPending ? "Saving..." : "Save changes"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Package className="h-3.5 w-3.5" />
                        Delivered
                      </div>
                      <p className="text-xl font-bold text-slate-900 dark:text-zinc-50">{detail.data.stats.ordersDelivered}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Star className="h-3.5 w-3.5" />
                        Reviews
                      </div>
                      <p className="text-xl font-bold text-slate-900 dark:text-zinc-50">
                        {detail.data.stats.reviewAvg != null ? `${detail.data.stats.reviewAvg} ★` : "-"}
                      </p>
                      <p className="text-xs text-slate-500">{detail.data.stats.reviewCount} ratings</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Wallet className="h-3.5 w-3.5" />
                        Wallet
                      </div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-zinc-50">{"\u20B9"}{detail.data.walletBalance}</p>
                      <p className="text-xs text-slate-500">Held {"\u20B9"}{detail.data.walletHeld}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Bike className="h-3.5 w-3.5" />
                        Vehicle
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-zinc-50">{detail.data.vehicleType ?? "-"}</p>
                      <p className="text-xs text-slate-500">{detail.data.vehicleNumber ?? "No number on file"}</p>
                    </div>
                  </div>

                  {/* Bank details */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      <CreditCard className="mr-1 inline h-3.5 w-3.5" />
                      Bank details
                    </h3>
                    {detail.data.bankDetails ? (
                      <dl className="rounded-xl border border-slate-100 p-3 text-sm dark:border-zinc-800">
                        {detail.data.bankDetails.accountName && (
                          <div className="flex justify-between border-b border-slate-50 py-1.5 dark:border-zinc-800">
                            <dt className="text-slate-500">Name</dt>
                            <dd className="font-medium text-slate-800 dark:text-zinc-200">{detail.data.bankDetails.accountName}</dd>
                          </div>
                        )}
                        {detail.data.bankDetails.bankName && (
                          <div className="flex justify-between border-b border-slate-50 py-1.5 dark:border-zinc-800">
                            <dt className="text-slate-500">Bank</dt>
                            <dd className="font-medium text-slate-800 dark:text-zinc-200">{detail.data.bankDetails.bankName}</dd>
                          </div>
                        )}
                        {detail.data.bankDetails.accountNumber && (
                          <div className="flex justify-between border-b border-slate-50 py-1.5 dark:border-zinc-800">
                            <dt className="text-slate-500">A/C No</dt>
                            <dd className="font-mono font-medium text-slate-800 dark:text-zinc-200">{detail.data.bankDetails.accountNumber}</dd>
                          </div>
                        )}
                        {detail.data.bankDetails.ifsc && (
                          <div className="flex justify-between border-b border-slate-50 py-1.5 dark:border-zinc-800">
                            <dt className="text-slate-500">IFSC</dt>
                            <dd className="font-mono font-medium text-slate-800 dark:text-zinc-200">{detail.data.bankDetails.ifsc}</dd>
                          </div>
                        )}
                        {detail.data.bankDetails.upiId && (
                          <div className="flex justify-between py-1.5">
                            <dt className="text-slate-500">UPI</dt>
                            <dd className="font-medium text-slate-800 dark:text-zinc-200">{detail.data.bankDetails.upiId}</dd>
                          </div>
                        )}
                      </dl>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-zinc-500">No bank details on file</p>
                    )}
                  </div>

                  {/* Info rows */}
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-slate-100 py-2 dark:border-zinc-800">
                      <dt className="text-slate-500">Availability</dt>
                      <dd className="font-medium text-slate-800 dark:text-zinc-200">{detail.data.availability}</dd>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-2 dark:border-zinc-800">
                      <dt className="text-slate-500">Approval</dt>
                      <dd className="font-medium text-slate-800 dark:text-zinc-200">{detail.data.approvalStatus}</dd>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-2 dark:border-zinc-800">
                      <dt className="text-slate-500">Lifetime delivery pay</dt>
                      <dd className="font-medium text-slate-800 dark:text-zinc-200">{"\u20B9"}{detail.data.stats.lifetimeDeliveryCredits}</dd>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-2 dark:border-zinc-800">
                      <dt className="text-slate-500">KYC</dt>
                      <dd className="font-medium text-slate-800 dark:text-zinc-200">{detail.data.kycStatus ?? "-"}</dd>
                    </div>
                    {detail.data.rejectionReason ? (
                      <div className="rounded-lg bg-orange-50 p-2 text-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
                        <dt className="text-xs font-medium">Rejection note</dt>
                        <dd className="mt-1">{detail.data.rejectionReason}</dd>
                      </div>
                    ) : null}
                  </dl>
                </>
              )}
            </div>
          ) : null}
      </AdminSlideOver>
    </div>
  );
}
