"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  TrendingUp,
  Clock,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type WalletData = {
  balance: string;
  heldBalance: string;
  transactions: { id: string; type: string; amount: string; createdAt: string }[];
  withdrawals: { id: string; amount: string; status: string; createdAt: string }[];
};

const TX_ICONS: Record<string, React.ElementType> = {
  CREDIT_DELIVERY: ArrowDownCircle,
  ADJUSTMENT: TrendingUp,
  WITHDRAWAL_HOLD: ArrowUpCircle,
  WITHDRAWAL_RELEASE: ArrowUpCircle,
  REVERSAL: ArrowDownCircle,
};

const TX_LABELS: Record<string, string> = {
  CREDIT_DELIVERY: "Delivery Earning",
  ADJUSTMENT: "Adjustment",
  WITHDRAWAL_HOLD: "Withdrawal Hold",
  WITHDRAWAL_RELEASE: "Withdrawal Release",
  REVERSAL: "Reversal",
};

const WD_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-600",
  PAID: "bg-sky-50 text-sky-700",
};

export default function RiderWalletPage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [toast, setToast] = React.useState<string | null>(null);
  const [showWithdraw, setShowWithdraw] = React.useState(false);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setMounted(true);
  }, [router]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const wallet = useQuery({
    queryKey: ["rider-wallet"],
    queryFn: () => api<WalletData>("/api/v1/rider/wallet"),
    enabled: mounted && !!getAccessToken(),
  });

  const withdraw = useMutation({
    mutationFn: () =>
      api<{ id: string }>("/api/v1/rider/withdrawals", {
        method: "POST",
        body: JSON.stringify({ amount }),
      }),
    onSuccess: () => {
      setToast("Withdrawal requested!");
      setAmount("");
      setShowWithdraw(false);
      void wallet.refetch();
    },
    onError: (e: Error) => setToast(e.message),
  });

  if (!mounted) return null;

  const bal = wallet.data ? Number(wallet.data.balance) : 0;
  const held = wallet.data ? Number(wallet.data.heldBalance) : 0;

  return (
    <div className="pb-28 pt-4">
      <div className="mb-5 px-5">
        <h1 className="text-xl font-bold text-slate-900">Wallet</h1>
      </div>

      {/* Balance card */}
      <div className="mx-5 mb-5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white shadow-lg shadow-amber-200/30">
        {wallet.isLoading ? (
          <Skeleton className="h-16 w-32 rounded bg-white/20" />
        ) : (
          <>
            <p className="text-xs font-medium text-amber-100">Available Balance</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{"\u20B9"}{Math.round(bal)}</p>
            {held > 0 && (
              <p className="mt-1 text-xs text-amber-200">
                {"\u20B9"}{Math.round(held)} held for pending withdrawals
              </p>
            )}
          </>
        )}
        <button
          type="button"
          onClick={() => setShowWithdraw((v) => !v)}
          className="mt-4 flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold transition hover:bg-white/30"
        >
          <Send className="h-4 w-4" />
          Request Withdrawal
        </button>
      </div>

      {/* Withdraw form */}
      {showWithdraw && (
        <div className="mx-5 mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-3 text-sm font-bold text-slate-700">Withdrawal Amount</h3>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{"\u20B9"}</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-12 w-full rounded-xl border border-slate-200 pl-7 pr-3 text-lg font-bold tabular-nums outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
            <button
              type="button"
              disabled={!amount || Number(amount) <= 0 || withdraw.isPending}
              onClick={() => withdraw.mutate()}
              className="h-12 rounded-xl bg-amber-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
            >
              {withdraw.isPending ? "..." : "Submit"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Max available: {"\u20B9"}{Math.max(0, Math.round(bal - held))}
          </p>
        </div>
      )}

      {/* Transactions */}
      <div className="px-5">
        <h2 className="mb-3 text-sm font-bold text-slate-700">Recent Transactions</h2>
        {wallet.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : (wallet.data?.transactions.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center">
            <Wallet className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {wallet.data!.transactions.slice(0, 20).map((tx) => {
              const Icon = TX_ICONS[tx.type] ?? ArrowDownCircle;
              const isCredit = tx.type.startsWith("CREDIT") || tx.type === "REVERSAL" || tx.type === "WITHDRAWAL_RELEASE";
              return (
                <div key={tx.id} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isCredit ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-700">{TX_LABELS[tx.type] ?? tx.type}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${isCredit ? "text-emerald-600" : "text-slate-700"}`}>
                    {isCredit ? "+" : "-"}{"\u20B9"}{Math.round(Math.abs(Number(tx.amount)))}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Withdrawals */}
        {(wallet.data?.withdrawals.length ?? 0) > 0 && (
          <div className="mt-5">
            <h2 className="mb-3 text-sm font-bold text-slate-700">Withdrawal History</h2>
            <div className="space-y-2">
              {wallet.data!.withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-100">
                  <div>
                    <p className="text-sm font-bold tabular-nums text-slate-800">{"\u20B9"}{Math.round(Number(w.amount))}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(w.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${WD_STYLES[w.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-slate-800 px-5 py-2.5 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
