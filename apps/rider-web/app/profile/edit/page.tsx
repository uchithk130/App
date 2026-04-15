"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@fitmeals/ui";
import { ChevronLeft, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type RiderMe = {
  fullName: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  licenseNumber: string | null;
  emergencyContact: string | null;
  address: string | null;
  isProfileCompleted: boolean;
};

export default function RiderEditProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mounted, setMounted] = React.useState(false);
  const [form, setForm] = React.useState({
    fullName: "",
    vehicleType: "",
    vehicleNumber: "",
    licenseNumber: "",
    emergencyContact: "",
    address: "",
  });
  const [toast, setToast] = React.useState<{ type: "success" | "error"; msg: string } | null>(null);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setMounted(true);
  }, [router]);

  const me = useQuery({
    queryKey: ["rider-me"],
    queryFn: () => api<RiderMe>("/api/v1/rider/me"),
    enabled: mounted && !!getAccessToken(),
  });

  React.useEffect(() => {
    if (me.data) {
      setForm({
        fullName: me.data.fullName,
        vehicleType: me.data.vehicleType ?? "",
        vehicleNumber: me.data.vehicleNumber ?? "",
        licenseNumber: me.data.licenseNumber ?? "",
        emergencyContact: me.data.emergencyContact ?? "",
        address: me.data.address ?? "",
      });
    }
  }, [me.data]);

  // Direct update (first-time profile completion)
  const directSave = useMutation({
    mutationFn: () =>
      api("/api/v1/rider/me/profile", { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: () => {
      setToast({ type: "success", msg: "Profile updated!" });
      void qc.invalidateQueries({ queryKey: ["rider-me"] });
    },
    onError: (e: Error) => setToast({ type: "error", msg: e.message }),
  });

  // Edit request (after profile is completed)
  const editRequest = useMutation({
    mutationFn: () =>
      api("/api/v1/rider/me/edit-requests", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => {
      setToast({ type: "success", msg: "Edit request submitted for admin review." });
      void qc.invalidateQueries({ queryKey: ["rider-me"] });
    },
    onError: (e: Error) => setToast({ type: "error", msg: e.message }),
  });

  const isCompleted = me.data?.isProfileCompleted ?? false;
  const loading = directSave.isPending || editRequest.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    if (isCompleted) {
      editRequest.mutate();
    } else {
      directSave.mutate();
    }
  };

  if (!mounted) return null;

  return (
    <div className="pb-28 pt-4">
      <div className="mb-5 px-5">
        <Link href="/profile" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-amber-600">
          <ChevronLeft className="h-4 w-4" /> Profile
        </Link>
        <h1 className="text-xl font-bold text-slate-900">
          {isCompleted ? "Edit Profile" : "Complete Profile"}
        </h1>
        {isCompleted && (
          <div className="mt-2 flex items-start gap-2 rounded-xl bg-blue-50 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p className="text-xs text-blue-700">
              Changes to your approved profile require admin review. Your current details remain active until the request is approved.
            </p>
          </div>
        )}
      </div>

      {me.isLoading ? (
        <div className="mx-5 space-y-4"><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-xl" /></div>
      ) : (
        <form onSubmit={handleSubmit} className="mx-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Full Name</span>
            <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Vehicle Type</span>
              <select value={form.vehicleType} onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400">
                <option value="">Select</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Scooter">Scooter</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Car">Car</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Vehicle Number</span>
              <input value={form.vehicleNumber} onChange={(e) => setForm((p) => ({ ...p, vehicleNumber: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400" placeholder="KA-01-XX" />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">License Number</span>
            <input value={form.licenseNumber} onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Emergency Contact</span>
            <input value={form.emergencyContact} onChange={(e) => setForm((p) => ({ ...p, emergencyContact: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" placeholder="+91..." />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Address</span>
            <textarea value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" />
          </label>

          {toast && (
            <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
              {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {toast.msg}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50">
            {loading ? "Submitting..." : isCompleted ? "Submit Edit Request" : "Save Profile"}
          </button>
        </form>
      )}
    </div>
  );
}
