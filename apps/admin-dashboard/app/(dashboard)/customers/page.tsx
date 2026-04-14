"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { AdminSlideOver } from "@/components/admin-slide-over";
import { AdminCustomerDetailPanel, type AdminCustomerDetail } from "@/components/admin-customer-detail-panel";

type CustomerRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  orderCount: number;
  memberSince: string;
};

function fmtShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setReady(true);
  }, [router]);

  const list = useQuery({
    queryKey: ["admin-customers-list"],
    queryFn: () => api<{ items: CustomerRow[] }>("/api/v1/admin/customers"),
    enabled: ready && !!getAccessToken(),
  });

  const detail = useQuery({
    queryKey: ["admin-customer-detail", selectedId],
    queryFn: () => api<AdminCustomerDetail>(`/api/v1/admin/customers/${selectedId}`),
    enabled: !!selectedId && panelOpen && !!getAccessToken(),
  });

  const openProfile = (id: string) => {
    setSelectedId(id);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedId(null), 200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Customers</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Browse customer profiles, order history, and saved meals.
        </p>
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-base">All customers</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {list.isLoading ? (
            <div className="p-6">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : list.isError ? (
            <p className="p-6 text-destructive">{(list.error as Error).message}</p>
          ) : (
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-800/40">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Name</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Email</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Phone</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Orders</th>
                  <th className="px-4 py-3 font-medium text-slate-600 dark:text-zinc-300">Member since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {list.data?.items.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-800/30"
                    onClick={() => openProfile(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openProfile(c.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-200">{c.fullName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{c.email}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{c.orderCount}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">{fmtShort(c.memberSince)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AdminSlideOver open={panelOpen} onClose={closePanel} title="Customer">
        {!selectedId ? null : detail.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : detail.isError ? (
          <p className="text-destructive">{(detail.error as Error).message}</p>
        ) : detail.data ? (
          <AdminCustomerDetailPanel data={detail.data} />
        ) : null}
      </AdminSlideOver>
    </div>
  );
}
