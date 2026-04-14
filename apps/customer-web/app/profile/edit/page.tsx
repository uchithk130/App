"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@fitmeals/ui";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type Profile = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  deliveryNotes: string | null;
};

export default function EditProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mounted, setMounted] = React.useState(false);
  const [name, setName] = React.useState("");
  const [deliveryNotes, setDeliveryNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => setMounted(true), []);

  const isAuthed = mounted && !!getAccessToken();

  const profile = useQuery({
    queryKey: ["customer-profile"],
    queryFn: () => api<Profile>("/api/v1/me/profile"),
    enabled: isAuthed,
    retry: false,
  });

  // Populate form once loaded
  React.useEffect(() => {
    if (profile.data) {
      setName(profile.data.fullName);
      setDeliveryNotes(profile.data.deliveryNotes ?? "");
    }
  }, [profile.data]);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      // Persist display name locally as fallback
      localStorage.setItem("kcal_display_name", trimmed);
      if (deliveryNotes.trim()) localStorage.setItem("kcal_delivery_notes", deliveryNotes.trim());
      void qc.invalidateQueries({ queryKey: ["customer-profile"] });
      setToast("Profile updated");
      setTimeout(() => router.push("/profile"), 600);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KcalViewportShell>
      <div className="flex min-h-dvh flex-col bg-[#f7f8f7]">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link
              href="/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5 text-slate-800" />
            </Link>
            <h1 className="text-base font-bold text-slate-900">Edit Profile</h1>
          </div>
        </header>

        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-10 pt-5">
          {profile.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Email (read only) */}
              {profile.data?.email && (
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{profile.data.email}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Email is tied to your login and can&apos;t be changed here.</p>
                </div>
              )}

              {/* Phone (read only) */}
              {profile.data?.phone && (
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{profile.data.phone}</p>
                </div>
              )}

              {/* Name */}
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Display Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>

              {/* Delivery notes */}
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Delivery Notes</span>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  placeholder="e.g. Ring the bell, leave at door..."
                />
              </label>

              {/* Save */}
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !name.trim()}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div className="fixed bottom-20 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-slate-800 px-5 py-2.5 text-xs font-medium text-white shadow-lg">
              {toast}
            </div>
          )}
        </main>
      </div>
    </KcalViewportShell>
  );
}
