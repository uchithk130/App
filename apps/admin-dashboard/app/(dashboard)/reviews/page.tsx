"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
  customerName: string;
  mealName: string;
};

type ReviewsRes = {
  items: ReviewItem[];
  summary: { averagePublished: number; publishedCount: number };
  newest: {
    comment: string | null;
    customerName: string;
    mealName: string;
    rating: number;
  } | null;
};

export default function ReviewsPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [tab, setTab] = React.useState<"all" | "published" | "hidden">("all");

  React.useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    setReady(true);
  }, [router]);

  const reviews = useQuery({
    queryKey: ["admin-reviews", tab],
    queryFn: () => api<ReviewsRes>(`/api/v1/admin/reviews?tab=${tab}`),
    enabled: ready && !!getAccessToken(),
  });

  const stars = (n: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(n) ? "text-admin-orange" : "text-slate-200"}>
        ★
      </span>
    ));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
          <p className="text-sm text-slate-500">Customer feedback on your meals</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 lg:grid lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap gap-4 border-b border-slate-200">
            {(
              [
                ["all", "All"],
                ["published", "Published"],
                ["hidden", "Hidden"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`border-b-2 pb-3 text-sm font-semibold transition ${
                  tab === k ? "border-admin-orange text-admin-orange" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent review</h2>
            <p className="text-sm text-slate-500">Here is customer review about your restaurant.</p>
          </div>

          <div className="space-y-4">
            {reviews.isLoading ? <p className="text-slate-500">Loading…</p> : null}
            {reviews.isError ? <p className="text-red-600">{(reviews.error as Error).message}</p> : null}
            {reviews.data?.items.map((r) => (
              <div key={r.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 text-sm font-bold text-admin-orange">
                      {r.customerName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{r.customerName}</div>
                      <div className="text-xs text-slate-500">
                        {r.mealName} · {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-admin-orange">{r.rating.toFixed(1)}</div>
                    <div className="text-lg leading-none">{stars(r.rating)}</div>
                  </div>
                </div>
                {r.comment ? <p className="mt-3 text-sm leading-relaxed text-slate-600">{r.comment}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Great", "Delicious", "Recommended"].map((t) => (
                    <span key={t} className="rounded-full bg-orange-50 px-3 py-0.5 text-xs font-medium text-admin-orange">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Newest</h3>
              <span className="text-slate-400">‹ ›</span>
            </div>
            {reviews.data?.newest ? (
              <>
                <blockquote className="text-sm italic text-slate-600">
                  “{reviews.data.newest.comment ?? "No comment"}”
                </blockquote>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-slate-200" />
                  <div>
                    <div className="text-sm font-semibold">{reviews.data.newest.customerName}</div>
                    <div className="text-xs text-slate-500">{reviews.data.newest.mealName}</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">No reviews yet.</p>
            )}
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-admin-orange to-amber-500 p-6 text-white shadow-lg shadow-orange-200/40">
            <div className="text-sm font-medium text-white/90">Overall (published)</div>
            <div className="mt-2 text-5xl font-bold">{reviews.data?.summary.averagePublished.toFixed(1) ?? "—"}</div>
            <div className="mt-2 text-2xl text-white">{stars(5)}</div>
            <div className="mt-2 text-xs text-white/80">{reviews.data?.summary.publishedCount ?? 0} reviews</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
