"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import { ChevronLeft, CheckCircle2, AlertCircle, Info, CreditCard, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type BankData = {
  status: string;
  account: {
    id: string;
    accountHolderName: string;
    maskedAccountNumber: string;
    ifscCode: string;
    bankName: string | null;
    upiId: string | null;
    verificationStatus: string;
    isActive: boolean;
    approvedAt: string | null;
  } | null;
};

export default function RiderBankDetailsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mounted, setMounted] = React.useState(false);
  const [form, setForm] = React.useState({
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
  });
  const [toast, setToast] = React.useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setMounted(true);
  }, [router]);

  const bank = useQuery({
    queryKey: ["rider-bank"],
    queryFn: () => api<BankData>("/api/v1/rider/me/bank-details"),
    enabled: mounted && !!getAccessToken(),
  });

  const submit = useMutation({
    mutationFn: () => {
      if (form.accountNumber !== form.confirmAccountNumber) {
        throw new Error("Account numbers do not match");
      }
      return api("/api/v1/rider/me/bank-details/submit", {
        method: "POST",
        body: JSON.stringify({
          accountHolderName: form.accountHolderName,
          accountNumber: form.accountNumber,
          ifscCode: form.ifscCode,
          bankName: form.bankName || undefined,
          upiId: form.upiId || undefined,
        }),
      });
    },
    onSuccess: () => {
      setToast({ type: "success", msg: bank.data?.account ? "Change request submitted for review." : "Bank details submitted for verification." });
      setShowForm(false);
      void qc.invalidateQueries({ queryKey: ["rider-bank"] });
      void qc.invalidateQueries({ queryKey: ["rider-me"] });
    },
    onError: (e: Error) => setToast({ type: "error", msg: e.message }),
  });

  if (!mounted) return null;

  const account = bank.data?.account;
  const hasAccount = !!account;

  return (
    <div className="pb-28 pt-4">
      <div className="mb-5 px-5">
        <Link href="/profile" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-amber-600">
          <ChevronLeft className="h-4 w-4" /> Profile
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Bank Details</h1>
        <p className="mt-1 text-sm text-slate-500">Your payout account for delivery earnings</p>
      </div>

      {bank.isLoading ? (
        <div className="mx-5 space-y-4"><Skeleton className="h-32 w-full rounded-2xl" /></div>
      ) : hasAccount && !showForm ? (
        <div className="mx-5 space-y-4">
          {/* Active bank card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <CreditCard className="h-6 w-6 text-amber-400" />
              {account.isActive && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  <ShieldCheck className="h-3 w-3" /> Active
                </span>
              )}
              {!account.isActive && (
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                  {account.verificationStatus.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <p className="text-lg font-bold tracking-wide">{account.maskedAccountNumber}</p>
            <p className="mt-1 text-sm text-slate-300">{account.accountHolderName}</p>
            <div className="mt-3 flex gap-4 text-xs text-slate-400">
              {account.bankName && <span>{account.bankName}</span>}
              <span>{account.ifscCode}</span>
            </div>
          </div>

          {account.isActive && (
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <p className="text-xs text-blue-700">
                Changes to approved bank details require admin review. Your current account remains active until the new one is approved.
              </p>
            </div>
          )}

          <button type="button" onClick={() => { setShowForm(true); setToast(null); }}
            className="w-full rounded-xl border border-amber-200 bg-amber-50 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100">
            {account.isActive ? "Update Bank Details" : "Re-submit Bank Details"}
          </button>

          {toast && (
            <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
              {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {toast.msg}
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); setToast(null); submit.mutate(); }}
          className="mx-5 space-y-4"
        >
          {hasAccount && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700">
                This will create a change request. Your current bank details remain active until admin approves the new ones.
              </p>
            </div>
          )}

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Account Holder Name</span>
            <input value={form.accountHolderName} onChange={(e) => setForm((p) => ({ ...p, accountHolderName: e.target.value }))} required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Account Number</span>
            <input value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} required
              type="password" autoComplete="off"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Confirm Account Number</span>
            <input value={form.confirmAccountNumber} onChange={(e) => setForm((p) => ({ ...p, confirmAccountNumber: e.target.value }))} required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">IFSC Code</span>
            <input value={form.ifscCode} onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))} required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" placeholder="SBIN0001234" />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Bank Name</span>
            <input value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">UPI ID (optional)</span>
            <input value={form.upiId} onChange={(e) => setForm((p) => ({ ...p, upiId: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" placeholder="rider@upi" />
          </label>

          {toast && (
            <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
              {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {toast.msg}
            </div>
          )}

          <div className="flex gap-3">
            {hasAccount && (
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700">Cancel</button>
            )}
            <button type="submit" disabled={submit.isPending}
              className="flex-1 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50">
              {submit.isPending ? "Submitting..." : hasAccount ? "Submit Change Request" : "Submit Bank Details"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
