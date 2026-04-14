"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@fitmeals/ui";
import {
  Check,
  XCircle,
  Banknote,
  Clock,
  AlertCircle,
  CreditCard,
  User,
  Phone,
  Mail,
  ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { AdminSlideOver } from "@/components/admin-slide-over";

type BankDetails = {
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  upiId?: string;
};

type WithdrawalRow = {
  id: string;
  amount: string;
  status: string;
  bankRef: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  rider: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    bankDetails: BankDetails | null;
  };
  walletBalance: string;
  walletHeld: string;
};

type StatusFilter = "all" | "PENDING" | "APPROVED" | "PAID" | "REJECTED";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  APPROVED: "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  REJECTED: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200",
};

export default function AdminPayoutsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [ready, setReady] = React.useState(false);
  const [filter, setFilter] = React.useState<StatusFilter>("PENDING");
  const [selectedWd, setSelectedWd] = React.useState<WithdrawalRow | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [bankRef, setBankRef] = React.useState("");
  const [adminNote, setAdminNote] = React.useState("");
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setReady(true);
  }, [router]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const withdrawals = useQuery({
    queryKey: ["admin-withdrawals", filter],
    queryFn: () =>
      api<{ items: WithdrawalRow[] }>(
        filter === "all"
          ? "/api/v1/admin/withdrawals"
          : `/api/v1/admin/withdrawals?status=${filter}`,
      ),
    enabled: ready && !!getAccessToken(),
    refetchInterval: 30_000,
  });

  const decideMutation = useMutation({
    mutationFn: async (args: { id: string; decision: string; bankRef?: string; adminNote?: string }) =>
      api(`/api/v1/admin/withdrawals/${args.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          decision: args.decision,
          bankRef: args.bankRef || undefined,
          adminNote: args.adminNote || undefined,
        }),
      }),
    onSuccess: (_data, vars) => {
      const label = vars.decision === "approve" ? "Approved" : vars.decision === "reject" ? "Rejected" : "Marked as Paid";
      setToast(`${label} successfully`);
      void qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      setPanelOpen(false);
    },
    onError: (e: Error) => setToast(e.message),
  });

  const openDetail = (w: WithdrawalRow) => {
    setSelectedWd(w);
    setBankRef(w.bankRef ?? "");
    setAdminNote(w.adminNote ?? "");
    setPanelOpen(true);
  };

  const pendingCount = withdrawals.data?.items.filter((w) => w.status === "PENDING").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Payouts</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Review rider withdrawal requests, approve, and mark as paid.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {(["PENDING", "APPROVED", "PAID", "REJECTED"] as const).map((s) => {
          const count = withdrawals.data?.items.filter((w) => w.status === s).length ?? 0;
          const total = withdrawals.data?.items
            .filter((w) => w.status === s)
            .reduce((acc, w) => acc + Number(w.amount), 0) ?? 0;
          const icons: Record<string, React.ElementType> = { PENDING: Clock, APPROVED: Check, PAID: Banknote, REJECTED: XCircle };
          const Icon = icons[s] ?? Clock;
          return (
            <Card key={s} className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  s === "PENDING" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                  s === "APPROVED" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                  s === "PAID" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{s}</p>
                  <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-zinc-50">{count}</p>
                  <p className="text-xs tabular-nums text-slate-500 dark:text-zinc-400">
                    {"\u20B9"}{Math.round(total).toLocaleString("en-IN")}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(["PENDING", "APPROVED", "PAID", "REJECTED", "all"] as const).map((f) => (
          <Button
            key={f}
            type="button"
            variant={filter === f ? "default" : "outline"}
            size="sm"
            className={filter === f ? "rounded-full bg-admin-orange hover:bg-admin-orange-hover" : "rounded-full"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            {f === "PENDING" && pendingCount > 0 && filter !== "PENDING" && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">{pendingCount}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base">Withdrawal requests</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {withdrawals.isLoading ? (
            <div className="p-6"><Skeleton className="h-40 w-full" /></div>
          ) : withdrawals.isError ? (
            <p className="p-6 text-destructive">{(withdrawals.error as Error).message}</p>
          ) : (withdrawals.data?.items.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Banknote className="mb-3 h-10 w-10 text-slate-200 dark:text-zinc-700" />
              <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">No withdrawal requests found</p>
            </div>
          ) : (
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-800/40">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Rider</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Amount</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Requested</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Bank Ref</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {withdrawals.data!.items.map((w) => (
                  <tr
                    key={w.id}
                    className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-800/30"
                    onClick={() => openDetail(w)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-zinc-200">{w.rider.fullName}</p>
                      <p className="text-xs text-slate-500">{w.rider.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-slate-900 dark:text-zinc-50">
                      {"\u20B9"}{Math.round(Number(w.amount)).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[w.status] ?? ""}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-zinc-400">
                      {new Date(w.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{w.bankRef ?? "-"}</td>
                    <td className="px-4 py-3">
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Detail panel */}
      <AdminSlideOver open={panelOpen} onClose={() => setPanelOpen(false)} title="Withdrawal details">
        {selectedWd && (
          <div className="space-y-6">
            {/* Amount */}
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-900">
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Amount requested</p>
              <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-zinc-50">
                {"\u20B9"}{Math.round(Number(selectedWd.amount)).toLocaleString("en-IN")}
              </p>
              <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[selectedWd.status] ?? ""}`}>
                {selectedWd.status}
              </span>
            </div>

            {/* Rider info */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Rider</h3>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-800 dark:text-zinc-200">{selectedWd.rider.fullName}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="h-3 w-3" /> {selectedWd.rider.email}
                </div>
                {selectedWd.rider.phone && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="h-3 w-3" /> {selectedWd.rider.phone}
                  </div>
                )}
                <div className="mt-2 flex gap-4 text-xs text-slate-500 dark:text-zinc-400">
                  <span>Balance: {"\u20B9"}{selectedWd.walletBalance}</span>
                  <span>Held: {"\u20B9"}{selectedWd.walletHeld}</span>
                </div>
              </div>
            </div>

            {/* Bank details */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Bank Details</h3>
              {selectedWd.rider.bankDetails ? (
                <div className="rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
                  <dl className="space-y-1.5 text-sm">
                    {selectedWd.rider.bankDetails.accountName && (
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Name</dt>
                        <dd className="font-medium text-slate-800 dark:text-zinc-200">{selectedWd.rider.bankDetails.accountName}</dd>
                      </div>
                    )}
                    {selectedWd.rider.bankDetails.bankName && (
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Bank</dt>
                        <dd className="font-medium text-slate-800 dark:text-zinc-200">{selectedWd.rider.bankDetails.bankName}</dd>
                      </div>
                    )}
                    {selectedWd.rider.bankDetails.accountNumber && (
                      <div className="flex justify-between">
                        <dt className="text-slate-500">A/C No</dt>
                        <dd className="font-mono font-medium text-slate-800 dark:text-zinc-200">{selectedWd.rider.bankDetails.accountNumber}</dd>
                      </div>
                    )}
                    {selectedWd.rider.bankDetails.ifsc && (
                      <div className="flex justify-between">
                        <dt className="text-slate-500">IFSC</dt>
                        <dd className="font-mono font-medium text-slate-800 dark:text-zinc-200">{selectedWd.rider.bankDetails.ifsc}</dd>
                      </div>
                    )}
                    {selectedWd.rider.bankDetails.upiId && (
                      <div className="flex justify-between">
                        <dt className="text-slate-500">UPI</dt>
                        <dd className="font-medium text-slate-800 dark:text-zinc-200">{selectedWd.rider.bankDetails.upiId}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  No bank details on file. Edit rider profile to add.
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedWd.status === "PENDING" && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Action</h3>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Admin note (optional)</span>
                  <input
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    placeholder="Internal note..."
                  />
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-500"
                    disabled={decideMutation.isPending}
                    onClick={() => decideMutation.mutate({ id: selectedWd.id, decision: "approve", adminNote })}
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="flex-1 gap-1"
                    disabled={decideMutation.isPending}
                    onClick={() => decideMutation.mutate({ id: selectedWd.id, decision: "reject", adminNote })}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            )}

            {selectedWd.status === "APPROVED" && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Mark as paid</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Transfer {"\u20B9"}{Math.round(Number(selectedWd.amount)).toLocaleString("en-IN")} to the rider's bank account, then record it here.
                </p>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Transaction / UTR reference</span>
                  <input
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-800"
                    placeholder="UTR / NEFT ref..."
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Admin note (optional)</span>
                  <input
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    placeholder="Note..."
                  />
                </label>
                <Button
                  type="button"
                  size="sm"
                  className="w-full gap-1 bg-emerald-600 hover:bg-emerald-500"
                  disabled={decideMutation.isPending}
                  onClick={() => decideMutation.mutate({ id: selectedWd.id, decision: "mark_paid", bankRef, adminNote })}
                >
                  <CreditCard className="h-4 w-4" /> Confirm Paid
                </Button>
              </div>
            )}

            {selectedWd.status === "PAID" && selectedWd.bankRef && (
              <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Payment reference</p>
                <p className="mt-1 font-mono text-sm font-semibold text-emerald-900 dark:text-emerald-100">{selectedWd.bankRef}</p>
              </div>
            )}

            {selectedWd.adminNote && (
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-zinc-900">
                <p className="text-xs font-medium text-slate-500">Admin note</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-zinc-300">{selectedWd.adminNote}</p>
              </div>
            )}

            <div className="text-xs text-slate-400 dark:text-zinc-600">
              <p>Requested: {new Date(selectedWd.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(selectedWd.updatedAt).toLocaleString()}</p>
              <p className="mt-1 font-mono">ID: {selectedWd.id}</p>
            </div>
          </div>
        )}
      </AdminSlideOver>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] rounded-xl bg-slate-800 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-zinc-200 dark:text-zinc-900">
          {toast}
        </div>
      )}
    </div>
  );
}
