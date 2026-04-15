"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import { ChevronLeft, CheckCircle2, Clock, XCircle, FileText, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type EditRequest = {
  id: string;
  requestType: "PROFILE" | "BANK_DETAILS";
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedDataJson: Record<string, unknown>;
  reviewNotes: string | null;
  maskedAccountNumber: string | null;
  verificationStatus: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
};

const STATUS_MAP: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  PENDING: { icon: Clock, color: "bg-amber-50 text-amber-700", label: "Pending Review" },
  APPROVED: { icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700", label: "Approved" },
  REJECTED: { icon: XCircle, color: "bg-rose-50 text-rose-600", label: "Rejected" },
};

export default function RiderEditRequestsPage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setMounted(true);
  }, [router]);

  const requests = useQuery({
    queryKey: ["rider-edit-requests"],
    queryFn: () => api<{ items: EditRequest[] }>("/api/v1/rider/me/edit-requests"),
    enabled: mounted && !!getAccessToken(),
  });

  if (!mounted) return null;

  return (
    <div className="pb-28 pt-4">
      <div className="mb-5 px-5">
        <Link href="/profile" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-amber-600">
          <ChevronLeft className="h-4 w-4" /> Profile
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Edit Requests</h1>
        <p className="mt-1 text-sm text-slate-500">Track your profile and bank change requests</p>
      </div>

      {requests.isLoading ? (
        <div className="mx-5 space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : !requests.data?.items.length ? (
        <div className="mx-5 flex flex-col items-center rounded-2xl bg-slate-50 p-8 text-center">
          <FileText className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No edit requests yet</p>
          <p className="mt-1 text-xs text-slate-400">Requests will appear here when you update your profile or bank details</p>
        </div>
      ) : (
        <div className="mx-5 space-y-3">
          {requests.data.items.map((r) => {
            const s = STATUS_MAP[r.status] ?? STATUS_MAP.PENDING!;
            const Icon = s.icon;
            const TypeIcon = r.requestType === "BANK_DETAILS" ? CreditCard : FileText;

            return (
              <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {r.requestType === "BANK_DETAILS" ? "Bank Details" : "Profile"}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${s.color}`}>
                    <Icon className="h-3 w-3" /> {s.label}
                  </span>
                </div>

                {r.requestType === "BANK_DETAILS" && r.maskedAccountNumber && (
                  <p className="font-mono text-sm text-slate-700">{r.maskedAccountNumber}</p>
                )}

                {r.requestType === "PROFILE" && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    {Object.entries(r.submittedDataJson).map(([k, v]) =>
                      v ? <span key={k}><span className="text-slate-400">{k}:</span> {String(v)}</span> : null
                    )}
                  </div>
                )}

                <p className="mt-2 text-[11px] text-slate-400">
                  Submitted {new Date(r.submittedAt).toLocaleDateString()}
                  {r.reviewedAt && ` \u00B7 Reviewed ${new Date(r.reviewedAt).toLocaleDateString()}`}
                </p>

                {r.reviewNotes && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                    <span className="font-medium">Admin note:</span> {r.reviewNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
