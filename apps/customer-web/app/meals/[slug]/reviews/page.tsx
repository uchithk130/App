"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Skeleton } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import {
  ReviewSummary,
  ReviewCard,
  FilterChips,
} from "@/components/product";

type ReviewsData = {
  mealId: string;
  mealName: string;
  averageRating: number | null;
  totalCount: number;
  distribution: Record<number, number>;
  filteredTotal: number;
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewerName: string;
  }[];
};

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "positive", label: "Positive" },
  { key: "negative", label: "Negative" },
  { key: "5", label: "5 ?" },
  { key: "4", label: "4 ?" },
  { key: "3", label: "3 ?" },
  { key: "2", label: "2 ?" },
  { key: "1", label: "1 ?" },
];

export default function MealReviewsPage() {
  const params = useParams<{ slug: string }>();
  const [filter, setFilter] = React.useState("all");

  const q = useQuery({
    queryKey: ["meal-reviews", params.slug, filter],
    queryFn: () =>
      api<ReviewsData>(`/api/v1/meals/${params.slug}/reviews?filter=${filter}&limit=30`),
    enabled: !!params.slug,
  });

  return (
    <KcalViewportShell>
      <div className="relative z-10 flex min-h-dvh flex-col bg-white">
        {/* ?? Header ?? */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
          <Link
            href={`/meals/${params.slug}`}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-kcal-charcoal" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-kcal-charcoal">Reviews</h1>
            {q.data?.mealName && (
              <p className="truncate text-xs text-kcal-muted">{q.data.mealName}</p>
            )}
          </div>
        </header>

        {/* ?? Body ?? */}
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-10 pt-6 lg:px-8">
          {/* Loading */}
          {q.isLoading && (
            <div className="space-y-4" data-testid="reviews-skeleton">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-8 w-3/4 rounded-lg" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          )}

          {/* Error */}
          {q.isError && (
            <p className="text-destructive">{(q.error as Error).message}</p>
          )}

          {/* Data */}
          {q.data && (
            <>
              {/* Summary section */}
              <section className="rounded-2xl bg-[#f0f7ef] p-5 ring-1 ring-emerald-100/60">
                <ReviewSummary
                  averageRating={q.data.averageRating}
                  totalCount={q.data.totalCount}
                  distribution={q.data.distribution}
                />
              </section>

              {/* Filter chips */}
              <div className="mt-5">
                <FilterChips
                  options={FILTER_OPTIONS}
                  active={filter}
                  onChange={setFilter}
                />
              </div>

              {/* Review list */}
              <div className="mt-4">
                {q.data.reviews.length === 0 ? (
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
                    <MessageSquare className="mb-3 h-10 w-10 text-slate-300" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-kcal-charcoal">No reviews match this filter</p>
                    <p className="mt-1 text-xs text-kcal-muted">Try a different filter or check back later.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {q.data.reviews.map((r) => (
                      <ReviewCard
                        key={r.id}
                        reviewerName={r.reviewerName}
                        rating={r.rating}
                        comment={r.comment}
                        createdAt={r.createdAt}
                      />
                    ))}
                  </div>
                )}

                {q.data.filteredTotal > q.data.reviews.length && (
                  <p className="mt-4 text-center text-xs text-kcal-muted">
                    Showing {q.data.reviews.length} of {q.data.filteredTotal} reviews
                  </p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </KcalViewportShell>
  );
}
