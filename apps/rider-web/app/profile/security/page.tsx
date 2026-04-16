"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, Shield, Lock, Smartphone, Monitor, Tablet,
  LogOut, Eye, EyeOff, Loader2, Check, AlertTriangle,
} from "lucide-react";
import { ToggleSwitch } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type Session = {
  id: string;
  browser: string;
  os: string;
  device: string;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
};

function DeviceIcon({ device }: { device: string }) {
  if (device === "Mobile") return <Smartphone className="h-5 w-5" />;
  if (device === "Tablet") return <Tablet className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  return days + "d ago";
}

function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, loading }: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-rose-50">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
        </div>
        <h3 className="mb-2 text-center text-lg font-bold text-slate-900">{title}</h3>
        <p className="mb-6 text-center text-sm text-slate-500">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const authed = mounted && !!getAccessToken();

  React.useEffect(() => {
    if (mounted && !getAccessToken()) router.replace("/login");
  }, [mounted, router]);

  // Change password state
  const [pwOpen, setPwOpen] = React.useState(false);
  const [currentPw, setCurrentPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [logoutOthers, setLogoutOthers] = React.useState(true);
  const [pwErr, setPwErr] = React.useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = React.useState(false);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmTitle, setConfirmTitle] = React.useState("");
  const [confirmMsg, setConfirmMsg] = React.useState("");
  const [confirmAction, setConfirmAction] = React.useState<(() => void) | null>(null);
  const [confirmLoading, setConfirmLoading] = React.useState(false);

  function openConfirm(title: string, msg: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmMsg(msg);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  }
  function closeConfirm() {
    setConfirmOpen(false);
    setConfirmAction(null);
    setConfirmLoading(false);
  }

  const changePw = useMutation({
    mutationFn: () => {
      if (newPw.length < 8) throw new Error("Password must be at least 8 characters");
      if (newPw !== confirmPw) throw new Error("Passwords do not match");
      return api("/api/v1/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw, logoutOtherSessions: logoutOthers }),
      });
    },
    onSuccess: () => {
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      void qc.invalidateQueries({ queryKey: ["sessions"] });
      setTimeout(() => setPwSuccess(false), 3000);
    },
    onError: (e) => setPwErr((e as Error).message),
  });

  // Sessions
  const sessionsQ = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api<{ items: Session[] }>("/api/v1/auth/sessions"),
    enabled: authed,
  });

  const revokeSession = useMutation({
    mutationFn: (id: string) => api(`/api/v1/auth/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => { closeConfirm(); void qc.invalidateQueries({ queryKey: ["sessions"] }); },
    onError: () => closeConfirm(),
  });

  const revokeOthers = useMutation({
    mutationFn: () => api("/api/v1/auth/sessions/others", { method: "DELETE" }),
    onSuccess: () => { closeConfirm(); void qc.invalidateQueries({ queryKey: ["sessions"] }); },
    onError: () => closeConfirm(),
  });

  const sessions = sessionsQ.data?.items ?? [];
  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  if (!mounted) return null;

  return (
    <>
        <div className="min-h-dvh bg-[#f7f8f7] pb-28 lg:pb-12">
          <main className="mx-auto max-w-2xl px-4 pt-8 lg:px-6">
            <Link href="/profile" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-amber-600">
              <ChevronLeft className="h-4 w-4" /> Profile
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Security</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your password and active sessions.</p>

            {/* Change Password */}
            <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <button
                type="button"
                onClick={() => { setPwOpen(!pwOpen); setPwErr(null); setPwSuccess(false); }}
                className="flex w-full items-center gap-3"
              >
                <div className={"flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50"}>
                  <Lock className={"h-5 w-5 text-amber-600"} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-slate-900">Change Password</p>
                  <p className="text-xs text-slate-500">Update your account password</p>
                </div>
                <ChevronLeft className={`h-4 w-4 text-slate-400 transition ${pwOpen ? "rotate-90" : "-rotate-90"}`} />
              </button>

              {pwOpen && (
                <form
                  className="mt-4 space-y-3 border-t border-slate-100 pt-4"
                  onSubmit={(e) => { e.preventDefault(); setPwErr(null); changePw.mutate(); }}
                >
                  <div className="relative">
                    <input type={showCurrent ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Current password" required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  <div className="relative">
                    <input type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password (min 8 chars)" required minLength={8} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm new password" required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Log out other sessions</span>
                    <ToggleSwitch checked={logoutOthers} onChange={setLogoutOthers} label="Logout others" />
                  </div>
                  {pwErr && <p className="text-xs text-red-600">{pwErr}</p>}
                  {pwSuccess && <p className="flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3.5 w-3.5" /> Password changed successfully</p>}
                  <button type="submit" disabled={changePw.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50">
                    {changePw.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Update Password
                  </button>
                </form>
              )}
            </section>

            {/* Active Sessions */}
            <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={"flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50"}>
                    <Shield className={"h-5 w-5 text-amber-600"} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Active Sessions</h2>
                    <p className="text-xs text-slate-500">{sessions.length} active session{sessions.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                {otherSessions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openConfirm(
                      "Log out all others",
                      "All other sessions will be signed out. Only this device will stay logged in.",
                      () => revokeOthers.mutate(),
                    )}
                    disabled={revokeOthers.isPending}
                    className="rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    Log out all others
                  </button>
                )}
              </div>

              {sessionsQ.isLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
              ) : sessions.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">No active sessions found.</p>
              ) : (
                <div className="space-y-2">
                  {currentSession && (
                    <div className={"flex items-center gap-3 rounded-xl border-2 border-amber-100 bg-emerald-50/30 p-3"}>
                      <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-amber-600"}>
                        <DeviceIcon device={currentSession.device} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{currentSession.browser} on {currentSession.os}</p>
                          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">This device</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Active now{currentSession.ip ? ` \u00B7 ${currentSession.ip}` : ""}</p>
                      </div>
                    </div>
                  )}
                  {otherSessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200/60 text-slate-500">
                        <DeviceIcon device={s.device} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{s.browser} on {s.os}</p>
                        <p className="text-[11px] text-slate-500">Last active {timeAgo(s.lastSeenAt)}{s.ip ? ` \u00B7 ${s.ip}` : ""}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sid = s.id;
                          openConfirm(
                            "Log out session",
                            `Sign out from ${s.browser} on ${s.os}? That device will need to log in again.`,
                            () => revokeSession.mutate(sid),
                          );
                        }}
                        disabled={revokeSession.isPending}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-rose-400 transition hover:bg-rose-50 disabled:opacity-40"
                        aria-label="Revoke session"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>

        {/* Confirm Modal */}
        <ConfirmModal
          open={confirmOpen}
          title={confirmTitle}
          message={confirmMsg}
          confirmLabel="Log out"
          onConfirm={() => { setConfirmLoading(true); confirmAction?.(); }}
          onCancel={closeConfirm}
          loading={confirmLoading}
        />
    </>
  );
}
