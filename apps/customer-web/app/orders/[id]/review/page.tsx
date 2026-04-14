"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Truck, UtensilsCrossed, Heart } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import {
  StarRatingSelector,
  PostDeliveryModal,
  TipAmountSelector,
  MealRatingCard,
} from "@/components/post-delivery";

/* ??? Types ??? */
type FlowState = {
  orderId: string;
  successModalSeen: boolean;
  orderRated: boolean;
  driverRated: boolean;
  tipHandled: boolean;
  mealsRated: boolean;
  completedAt: string | null;
  hasRider: boolean;
  riderName: string | null;
  riderId: string | null;
};

type OrderDetail = {
  id: string;
  status: string;
  items: {
    id: string;
    mealId: string;
    quantity: number;
    unitPrice: string;
    meal: { name: string; slug: string; coverUrl: string | null };
  }[];
  assignment: { rider: { id: string; fullName: string } } | null;
};

type Step = "success" | "order-rating" | "driver-rating" | "tip" | "meal-rating" | "done";

function nextStep(flow: FlowState): Step {
  if (!flow.successModalSeen) return "success";
  if (!flow.orderRated) return "order-rating";
  if (flow.hasRider && !flow.driverRated) return "driver-rating";
  if (flow.hasRider && !flow.tipHandled) return "tip";
  if (!flow.mealsRated) return "meal-rating";
  return "done";
}

/* ??? Main Page ??? */
export default function PostDeliveryReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const flowQ = useQuery({
    queryKey: ["post-delivery-flow", params.id],
    queryFn: () => api<FlowState>(`/api/v1/orders/${params.id}/post-delivery`),
    enabled: !!params.id,
  });
  const orderQ = useQuery({
    queryKey: ["order", params.id],
    queryFn: () => api<OrderDetail>(`/api/v1/orders/${params.id}`),
    enabled: !!params.id,
  });

  const patchFlow = useMutation({
    mutationFn: (data: Record<string, boolean>) =>
      api(`/api/v1/orders/${params.id}/post-delivery`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["post-delivery-flow", params.id] }),
  });

  const flow = flowQ.data;
  const order = orderQ.data;
  const step = flow ? nextStep(flow) : null;

  /* ---------- step: success modal ---------- */
  const [showSuccess, setShowSuccess] = React.useState(true);

  /* ---------- step: order rating ---------- */
  const [orderRating, setOrderRating] = React.useState(0);
  const [orderComment, setOrderComment] = React.useState("");
  const submitOrderRating = useMutation({
    mutationFn: () =>
      api(`/api/v1/orders/${params.id}/rating`, {
        method: "POST",
        body: JSON.stringify({ rating: orderRating, comment: orderComment || undefined }),
      }),
    onSuccess: () => patchFlow.mutate({ orderRated: true }),
  });

  /* ---------- step: driver rating ---------- */
  const [driverRating, setDriverRating] = React.useState(0);
  const [driverComment, setDriverComment] = React.useState("");
  const submitDriverRating = useMutation({
    mutationFn: () =>
      api(`/api/v1/orders/${params.id}/driver-rating`, {
        method: "POST",
        body: JSON.stringify({ rating: driverRating, comment: driverComment || undefined }),
      }),
    onSuccess: () => patchFlow.mutate({ driverRated: true }),
  });

  /* ---------- step: tip ---------- */
  const TIP_PRESETS = [10, 20, 30, 50, 75, 100, 150, 200];
  const [tipSelected, setTipSelected] = React.useState<number | null>(null);
  const [tipCustom, setTipCustom] = React.useState("");
  const tipAmount = tipCustom ? Number(tipCustom) : tipSelected ?? 0;
  const submitTip = useMutation({
    mutationFn: () =>
      api(`/api/v1/orders/${params.id}/tip`, {
        method: "POST",
        body: JSON.stringify({ amount: tipAmount }),
      }),
    onSuccess: () => patchFlow.mutate({ tipHandled: true }),
  });
  const skipTip = () => patchFlow.mutate({ tipHandled: true });

  /* ---------- step: meal rating ---------- */
  const [mealRatings, setMealRatings] = React.useState<Record<string, { rating: number; comment: string }>>({});
  const setMealRating = (mealId: string, rating: number) =>
    setMealRatings((p) => ({ ...p, [mealId]: { rating, comment: p[mealId]?.comment ?? "" } }));
  const setMealComment = (mealId: string, comment: string) =>
    setMealRatings((p) => ({ ...p, [mealId]: { rating: p[mealId]?.rating ?? 0, comment } }));

  const submitMealRatings = useMutation({
    mutationFn: () => {
      const items = Object.entries(mealRatings)
        .filter(([, v]) => v.rating > 0)
        .map(([mealId, v]) => ({ mealId, rating: v.rating, comment: v.comment || undefined }));
      if (!items.length) return api(`/api/v1/orders/${params.id}/post-delivery`, { method: "PATCH", body: JSON.stringify({ mealsRated: true }) });
      return api(`/api/v1/orders/${params.id}/meal-ratings`, {
        method: "POST",
        body: JSON.stringify({ items }),
      });
    },
    onSuccess: () => patchFlow.mutate({ mealsRated: true }),
  });

  /* ---------- step: done ---------- */
  const [showThanks, setShowThanks] = React.useState(false);
  React.useEffect(() => {
    if (step === "done") setShowThanks(true);
  }, [step]);

  /* ---------- loading / error ---------- */
  if (flowQ.isLoading || orderQ.isLoading) {
    return (
      <KcalViewportShell>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#f7f8f7]">
          <Skeleton className="h-40 w-64 rounded-2xl" />
          <Skeleton className="h-6 w-48 rounded-lg" />
        </div>
      </KcalViewportShell>
    );
  }

  if (flowQ.isError) {
    return (
      <KcalViewportShell>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f7f8f7] px-6 text-center">
          <p className="text-sm text-slate-500">Could not load review flow. The order may not be delivered yet.</p>
          <Link
            href={`/orders/${params.id}`}
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white"
          >
            Back to Order
          </Link>
        </div>
      </KcalViewportShell>
    );
  }

  /* ??? Render steps ??? */
  const backHref = `/orders/${params.id}`;
  const riderName = flow?.riderName ?? order?.assignment?.rider.fullName ?? "Rider";
  const riderInitial = riderName.charAt(0).toUpperCase();

  return (
    <KcalViewportShell>
      {/* Step: Success Modal */}
      {step === "success" && (
        <PostDeliveryModal
          open={showSuccess}
          title="Delivery Successful!"
          message="Your healthy meal has arrived. Enjoy every bite!"
          ctaLabel="Rate Your Experience"
          onCta={() => {
            setShowSuccess(false);
            patchFlow.mutate({ successModalSeen: true });
          }}
        />
      )}

      {/* Step: Thank-you Modal */}
      {step === "done" && (
        <PostDeliveryModal
          open={showThanks}
          variant="thanks"
          title="Thank You!"
          message="Your feedback helps us serve you better and supports our delivery partners."
          ctaLabel="Back to Home"
          onCta={() => router.push("/")}
          onClose={() => router.push("/")}
        />
      )}

      {/* Step: Order Rating */}
      {step === "order-rating" && (
        <div className="flex min-h-dvh flex-col bg-[#f7f8f7]">
          <StepHeader backHref={backHref} title="Rate Order" />
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <UtensilsCrossed className="h-10 w-10 text-emerald-600" strokeWidth={1.5} />
            </div>
            <h2 className="mb-1 text-xl font-bold text-slate-900">Rate your Experience</h2>
            <p className="mb-6 text-sm text-slate-500">How was your overall order experience?</p>
            <StarRatingSelector value={orderRating} onChange={setOrderRating} />
            {orderRating > 0 && (
              <textarea
                value={orderComment}
                onChange={(e) => setOrderComment(e.target.value)}
                placeholder={orderRating <= 2 ? "Tell us what went wrong..." : "Any additional feedback? (optional)"}
                rows={3}
                className="mt-5 w-full max-w-sm resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            )}
          </div>
          <StepFooter
            submitLabel="Submit"
            onSubmit={() => submitOrderRating.mutate()}
            submitDisabled={orderRating === 0 || submitOrderRating.isPending}
            isPending={submitOrderRating.isPending}
            skipLabel="Skip"
            onSkip={() => patchFlow.mutate({ orderRated: true })}
          />
        </div>
      )}

      {/* Step: Driver Rating */}
      {step === "driver-rating" && (
        <div className="flex min-h-dvh flex-col bg-[#f7f8f7]">
          <StepHeader backHref={backHref} title="Rate Driver" />
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
              {riderInitial}
            </div>
            <p className="mb-0.5 text-lg font-bold text-slate-900">{riderName}</p>
            <p className="mb-6 text-sm text-slate-500">Delivery Partner</p>
            <h2 className="mb-4 text-base font-semibold text-slate-700">Rate your driver&apos;s delivery service</h2>
            <StarRatingSelector value={driverRating} onChange={setDriverRating} />
            {driverRating > 0 && (
              <textarea
                value={driverComment}
                onChange={(e) => setDriverComment(e.target.value)}
                placeholder="Anything to share about the delivery? (optional)"
                rows={3}
                className="mt-5 w-full max-w-sm resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            )}
          </div>
          <StepFooter
            submitLabel="Submit"
            onSubmit={() => submitDriverRating.mutate()}
            submitDisabled={driverRating === 0 || submitDriverRating.isPending}
            isPending={submitDriverRating.isPending}
            skipLabel="Skip"
            onSkip={() => patchFlow.mutate({ driverRated: true })}
          />
        </div>
      )}

      {/* Step: Tip Driver */}
      {step === "tip" && (
        <div className="flex min-h-dvh flex-col bg-[#f7f8f7]">
          <StepHeader backHref={backHref} title="Give Thanks" />
          <div className="flex flex-1 flex-col px-6 pt-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
              {riderInitial}
            </div>
            <p className="mb-0.5 text-center text-lg font-bold text-slate-900">{riderName}</p>
            <p className="mb-6 text-center text-sm text-slate-500">Delivery Partner</p>

            <h2 className="mb-1 text-base font-bold text-slate-900">Tip your delivery driver</h2>
            <p className="mb-4 text-xs text-slate-500">100% of your tip goes directly to your rider</p>

            <TipAmountSelector
              amounts={TIP_PRESETS}
              selected={tipSelected}
              onSelect={setTipSelected}
              customValue={tipCustom}
              onCustomChange={setTipCustom}
            />
          </div>
          <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => submitTip.mutate()}
              disabled={tipAmount <= 0 || submitTip.isPending}
              className="mb-2 w-full rounded-full bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
            >
              {submitTip.isPending ? "Processing..." : `Pay Tip \u20b9${tipAmount || ""}`}
            </button>
            <button
              type="button"
              onClick={skipTip}
              disabled={patchFlow.isPending}
              className="w-full rounded-full py-3 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
            >
              No Thanks
            </button>
          </div>
        </div>
      )}

      {/* Step: Meal Rating */}
      {step === "meal-rating" && order && (
        <div className="flex min-h-dvh flex-col bg-[#f7f8f7]">
          <StepHeader backHref={backHref} title="Rate Your Meals" />
          <div className="flex-1 space-y-3 px-4 py-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Order #{params.id.slice(-6).toUpperCase()}
            </p>
            {order.items.map((item) => (
              <MealRatingCard
                key={item.mealId}
                mealId={item.mealId}
                mealName={item.meal.name}
                coverUrl={item.meal.coverUrl}
                rating={mealRatings[item.mealId]?.rating ?? 0}
                comment={mealRatings[item.mealId]?.comment ?? ""}
                onRatingChange={(r) => setMealRating(item.mealId, r)}
                onCommentChange={(c) => setMealComment(item.mealId, c)}
              />
            ))}
          </div>
          <StepFooter
            submitLabel="Submit Reviews"
            onSubmit={() => submitMealRatings.mutate()}
            submitDisabled={submitMealRatings.isPending}
            isPending={submitMealRatings.isPending}
            skipLabel="Skip"
            onSkip={() => patchFlow.mutate({ mealsRated: true })}
          />
        </div>
      )}
    </KcalViewportShell>
  );
}

/* ??? Shared sub-components ??? */

function StepHeader({ backHref, title }: { backHref: string; title: string }) {
  return (
    <header className="flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
      <Link
        href={backHref}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-100"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5 text-slate-700" />
      </Link>
      <h1 className="flex-1 text-center text-lg font-bold text-slate-900">{title}</h1>
      <span className="w-10" />
    </header>
  );
}

function StepFooter({
  submitLabel,
  onSubmit,
  submitDisabled,
  isPending,
  skipLabel,
  onSkip,
}: {
  submitLabel: string;
  onSubmit: () => void;
  submitDisabled: boolean;
  isPending: boolean;
  skipLabel: string;
  onSkip: () => void;
}) {
  return (
    <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled}
        className="mb-2 w-full rounded-full bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Submitting..." : submitLabel}
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="w-full rounded-full py-3 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
      >
        {skipLabel}
      </button>
    </div>
  );
}
