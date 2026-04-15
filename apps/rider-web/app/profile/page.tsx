"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import {
  ChevronRight,
  HelpCircle,
  FileText,
  LogOut,
  Shield,
  Truck,
  User,
  CreditCard,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Pencil,
  Ban,
} from "lucide-react";
import { api } from "@/lib/api";
import { clearTokens, getAccessToken } from "@/lib/auth-store";
import { API_BASE } from "@/lib/config";

type BankAccount = {
  accountHolderName: string;
  maskedAccountNumber: string;
  bankName: string | null;
  ifscCode: string;
  upiId: string | null;
  verificationStatus: string;
  isActive: boolean;
};

type RiderMe = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  availability: string;
  approvalStatus: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  licenseNumber: string | null;
  emergencyContact: string | null;
  address: string | null;
  isProfileCompleted: boolean;
  bankAccount: BankAccount | null;
  pendingEditRequests: number;
  stats: { totalDeliveries: number };
};

function ApprovalBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ElementType; className: string; label: string }> = {
    APPROVED: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700", label: "Approved" },
    PENDING: { icon: Clock, className: "bg-amber-50 text-amber-700", label: "Pending" },
    REJECTED: { icon: XCircle, className: "bg-rose-50 text-rose-600", label: "Rejected" },
    SUSPENDED: { icon: Ban, className: "bg-red-50 text-red-600", label: "Suspended" },
  };
  const s = map[status] ?? map.PENDING!;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.className}`}>
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}

function BankStatusCard({ account }: { account: BankAccount | null }) {
  if (!account) {
    return (
      <Link href="/profile/bank-details" className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200/60">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <CreditCard className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900">Add Bank Details</p>
          <p className="text-xs text-slate-500">Required for withdrawals</p>
        </div>
        <ChevronRight className="h-4 w-4 text-amber-400" />
      </Link>
    );
  }
  const statusMap: Record<string, { color: string; label: string }> = {
    NOT_SUBMITTED: { color: "text-slate-500", label: "Not submitted" },
    PENDING_VERIFICATION: { color: "text-amber-600", label: "Pending verification" },
    VERIFICATION_IN_PROGRESS: { color: "text-blue-600", label: "Verifying..." },
    VERIFIED: { color: "text-emerald-600", label: "Verified & Active" },
    VERIFICATION_FAILED: { color: "text-rose-600", label: "Verification failed" },
  };
  const vs = account.isActive
    ? { color: "text-emerald-600", label: "Verified & Active" }
    : (statusMap[account.verificationStatus] ?? statusMap.NOT_SUBMITTED!);

  return (
    <Link href="/profile/bank-details" className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bank Account</span>
        </div>
        <span className={`text-[11px] font-bold ${vs.color}`}>{vs.label}</span>
      </div>
      <p className="text-sm font-medium text-slate-900">{account.accountHolderName}</p>
      <p className="mt-0.5 font-mono text-xs text-slate-500">{account.maskedAccountNumber}</p>
      {account.bankName && <p className="text-xs text-slate-400">{account.bankName} &middot; {account.ifscCode}</p>}
    </Link>
  );
}

function MenuRow({ icon: Icon, label, href, badge }: { icon: React.ElementType; label: string; href: string; badge?: number }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 transition active:bg-slate-50 hover:bg-slate-50">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
      {badge != null && badge > 0 && (
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">{badge}</span>
      )}
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </Link>
  );
}

export default function RiderProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setMounted(true);
  }, [router]);

  const me = useQuery({
    queryKey: ["rider-me"],
    queryFn: () => api<RiderMe>("/api/v1/rider/me"),
    enabled: mounted && !!getAccessToken(),
  });

  const handleLogout = async () => {
    clearTokens();
    await fetch(`${API_BASE}/api/v1/auth/logout`, { method: "POST", credentials: "include" }).catch(() => undefined);
    router.push("/login");
  };

  if (!mounted) return null;
  const d = me.data;
  const initials = d ? d.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "R";

  return (
    <div className="pb-28 pt-4">
      <div className="mb-5 px-5"><h1 className="text-xl font-bold text-slate-900">Profile</h1></div>

      {/* Profile card */}
      <div className="mx-5 mb-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        {me.isLoading ? (
          <div className="flex items-center gap-4"><Skeleton className="h-16 w-16 rounded-full" /><div className="space-y-2"><Skeleton className="h-5 w-32 rounded" /><Skeleton className="h-3.5 w-24 rounded" /></div></div>
        ) : d ? (
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xl font-bold text-white ring-4 ring-amber-100">{initials}</div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900">{d.fullName}</h2>
              {d.phone && <p className="flex items-center gap-1 text-xs text-slate-500"><Phone className="h-3 w-3" /> {d.phone}</p>}
              {d.email && <p className="flex items-center gap-1 text-xs text-slate-400"><Mail className="h-3 w-3" /> {d.email}</p>}
              <div className="mt-1.5 flex flex-wrap gap-2">
                <ApprovalBadge status={d.approvalStatus} />
                {d.vehicleType && <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600"><Truck className="h-3 w-3" /> {d.vehicleType}</span>}
                {!d.isProfileCompleted && <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600"><AlertCircle className="h-3 w-3" /> Incomplete</span>}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Profile completion CTA */}
      {d && !d.isProfileCompleted && (
        <div className="mx-5 mb-4">
          <Link href="/profile/edit" className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/60 p-4 ring-1 ring-amber-200/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white"><Pencil className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Complete Your Profile</p>
              <p className="text-xs text-slate-500">Add vehicle &amp; personal details to start delivering</p>
            </div>
            <ChevronRight className="h-4 w-4 text-amber-400" />
          </Link>
        </div>
      )}

      {/* Stats */}
      {d && (
        <div className="mx-5 mb-5 flex gap-3">
          <div className="flex-1 rounded-xl bg-amber-50 p-3 text-center">
            <p className="text-xl font-bold text-amber-700">{d.stats.totalDeliveries}</p>
            <p className="text-[10px] font-semibold text-amber-600">Total Deliveries</p>
          </div>
          {d.vehicleNumber && <div className="flex-1 rounded-xl bg-slate-50 p-3 text-center"><p className="text-sm font-bold text-slate-700">{d.vehicleNumber}</p><p className="text-[10px] font-semibold text-slate-500">Vehicle</p></div>}
        </div>
      )}

      {/* Bank details card */}
      <div className="mx-5 mb-4"><BankStatusCard account={d?.bankAccount ?? null} /></div>

      {/* Menu */}
      <div className="mx-5 space-y-0.5">
        <MenuRow icon={Pencil} label="Edit Profile" href="/profile/edit" badge={d?.pendingEditRequests} />
        <MenuRow icon={CreditCard} label="Bank Details" href="/profile/bank-details" />
        <MenuRow icon={User} label="Edit Requests" href="/profile/edit-requests" />
        <div className="my-2 h-px bg-slate-100" />
        <MenuRow icon={Shield} label="Security" href="/profile/security" />
        <MenuRow icon={HelpCircle} label="Help Center" href="/profile/help" />
        <MenuRow icon={FileText} label="Terms &amp; Privacy" href="/profile/terms" />
      </div>

      {/* Logout */}
      <div className="mx-5 mt-4">
        <button type="button" onClick={() => setShowLogoutConfirm(true)} className="flex w-full items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3.5 transition hover:bg-rose-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm"><LogOut className="h-4 w-4" /></span>
          <span className="flex-1 text-left text-sm font-bold text-rose-600">Log Out</span>
          <ChevronRight className="h-4 w-4 text-rose-300" />
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50"><LogOut className="h-6 w-6 text-rose-500" /></div>
            <h3 className="mb-2 text-center text-lg font-bold text-slate-900">Logout</h3>
            <p className="mb-6 text-center text-sm text-slate-500">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={() => void handleLogout()} className="flex-1 rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-sm">Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
