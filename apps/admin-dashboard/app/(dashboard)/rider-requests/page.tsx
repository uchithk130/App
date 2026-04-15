"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@fitmeals/ui";
import { Check, XCircle, FileText, CreditCard, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { AdminSlideOver } from "@/components/admin-slide-over";

type RequestRow = {
  id: string;
  riderId: string;
  riderName: string;
  riderEmail: string;
  requestType: "PROFILE" | "BANK_DETAILS";
  status: "PENDING" | "APPROVED" | "REJECTED";
  currentDataJson: Record<string, unknown> | null;
  submittedDataJson: Record<string, unknown>;
  maskedAccountNumber: string | null;
  verificationStatus: string | null;
  reviewNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
};

type FilterStatus = "PENDING" | "APPROVED" | "REJECTED" | "all";

export default function AdminEditRequestsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [ready, setReady] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterStatus>("PENDING");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [actionMsg, setActionMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setReady(true);
  }, [router]);

  const list = useQuery({
    queryKey: ["admin-edit-requests", filter],
    queryFn: () => api<{ items: RequestRow[] }>(`/api/v1/admin/rider-edit-requests${filter !== "all" ? `?status=${filter}` : ""}`),
    enabled: ready && !!getAccessToken(),
  });

  const selectedReq = list.data?.items.find((r) => r.id === selected);

  const action = useMutation({
    mutationFn: (act: "approve" | "reject") =>
      api(`/api/v1/admin/rider-edit-requests/${selected}`, {
        method: "POST",
        body: JSON.stringify({ action: act, reviewNotes: reviewNotes || undefined }),
      }),
    onSuccess: (_, act) => {
      setActionMsg(act === "approve" ? "Approved." : "Rejected.");
      void qc.invalidateQueries({ queryKey: ["admin-edit-requests"] });
      setReviewNotes("");
    },
    onError: (e: Error) => setActionMsg(e.message),
  });

  const openPanel = (id: string) => {
    setSelected(id);
    setPanelOpen(true);
    setActionMsg(null);
    setReviewNotes("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Rider Edit Requests</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Review profile and bank detail change requests</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["PENDING", "APPROVED", "REJECTED", "all"] as const).map((f) => (
          <Button key={f} type="button" variant={filter === f ? "default" : "outline"} size="sm"
            className={filter === f ? "rounded-full bg-admin-orange hover:bg-admin-orange-hover" : "rounded-full"}
            onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <CardHeader><CardTitle className="text-base">Requests</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {list.isLoading ? (
            <div className="p-6"><Skeleton className="h-40 w-full" /></div>
          ) : !list.data?.items.length ? (
            <p className="p-6 text-sm text-slate-400">No requests found</p>
          ) : (
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-800/40">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Rider</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Type</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {list.data.items.map((r) => (
                  <tr key={r.id} className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-800/30"
                    onClick={() => openPanel(r.id)} tabIndex={0} role="button"
                    onKeyDown={(e) => { if (e.key === "Enter") openPanel(r.id); }}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-200">{r.riderName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                        {r.requestType === "BANK_DETAILS" ? <CreditCard className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {r.requestType === "BANK_DETAILS" ? "Bank" : "Profile"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : r.status === "PENDING" ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-800"
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(r.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AdminSlideOver open={panelOpen} onClose={() => setPanelOpen(false)} title="Review Request">
        {selectedReq ? (
          <div className="space-y-5">
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-zinc-50">{selectedReq.riderName}</p>
              <p className="text-sm text-slate-500">{selectedReq.riderEmail}</p>
              <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                selectedReq.requestType === "BANK_DETAILS" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"
              }`}>
                {selectedReq.requestType === "BANK_DETAILS" ? "Bank Details" : "Profile"} Change
              </span>
            </div>

            {/* Comparison */}
            {selectedReq.currentDataJson && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Changes</h3>
                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_1fr] text-xs">
                    <div className="bg-slate-50 px-3 py-2 font-medium text-slate-500 dark:bg-zinc-800/50">Current</div>
                    <div className="bg-slate-50 px-2 py-2 dark:bg-zinc-800/50" />
                    <div className="bg-amber-50 px-3 py-2 font-medium text-amber-700 dark:bg-amber-950/20">Requested</div>
                  </div>
                  {Object.keys(selectedReq.submittedDataJson).map((key) => {
                    const curr = selectedReq.currentDataJson?.[key];
                    const next = selectedReq.submittedDataJson[key];
                    const changed = String(curr ?? "") !== String(next ?? "");
                    return (
                      <div key={key} className={`grid grid-cols-[1fr_auto_1fr] border-t border-slate-100 dark:border-zinc-800 ${changed ? "bg-amber-50/30" : ""}`}>
                        <div className="px-3 py-2 text-xs text-slate-600 dark:text-zinc-300">
                          <div className="text-[10px] text-slate-400">{key}</div>
                          {String(curr ?? "-")}
                        </div>
                        <div className="flex items-center px-1">{changed && <ArrowRight className="h-3 w-3 text-amber-500" />}</div>
                        <div className={`px-3 py-2 text-xs ${changed ? "font-medium text-amber-700" : "text-slate-600"}`}>
                          <div className="text-[10px] text-slate-400">{key}</div>
                          {String(next ?? "-")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No current data (first submission shown as list) */}
            {!selectedReq.currentDataJson && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted Data</h3>
                <dl className="rounded-xl border border-slate-100 p-3 text-sm dark:border-zinc-800">
                  {Object.entries(selectedReq.submittedDataJson).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-50 py-1.5 last:border-0 dark:border-zinc-800">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-medium text-slate-800 dark:text-zinc-200">{String(v ?? "-")}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {selectedReq.maskedAccountNumber && (
              <div className="rounded-lg bg-slate-50 p-3 font-mono text-sm text-slate-700 dark:bg-zinc-800/50 dark:text-zinc-200">
                Account: {selectedReq.maskedAccountNumber}
              </div>
            )}

            {actionMsg && <p className="text-sm text-slate-600 dark:text-zinc-400">{actionMsg}</p>}

            {selectedReq.status === "PENDING" && (
              <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">Review notes (optional)</span>
                  <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                </label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-500"
                    disabled={action.isPending} onClick={() => action.mutate("approve")}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button type="button" size="sm" variant="destructive" className="gap-1"
                    disabled={action.isPending} onClick={() => action.mutate("reject")}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            )}

            {selectedReq.reviewNotes && selectedReq.status !== "PENDING" && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-zinc-800/50">
                <span className="font-medium text-slate-500">Review notes:</span> {selectedReq.reviewNotes}
              </div>
            )}
          </div>
        ) : null}
      </AdminSlideOver>
    </div>
  );
}
