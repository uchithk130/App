"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Tag, Loader2 } from "lucide-react";
import { Skeleton } from "@fitmeals/ui";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { PromotionCard } from "@/components/basket/promotion-card";
import { PromoInfoSheet } from "@/components/basket/promo-info-sheet";

type CouponItem = {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  discountLabel: string;
  freeShipping: boolean;
  percentOff: string | null;
  amountOff: string | null;
  maxDiscount: string | null;
  minOrderAmount: string | null;
  validFrom: string | null;
  expiresAt: string | null;
  firstOrderOnly: boolean;
  termsAndConditions: string | null;
  displayBadge: string | null;
  applicable: boolean;
  inapplicableReason: string | null;
};

export default function PromotionsPage() {
  const router = useRouter();
  const [authed, setAuthed] = React.useState(false);
  const [selectedCode, setSelectedCode] = React.useState<string | null>(null);
  const [codeInput, setCodeInput] = React.useState("");
  const [infoCoupon, setInfoCoupon] = React.useState<CouponItem | null>(null);

  React.useEffect(() => {
    setAuthed(!!getAccessToken());
    const stored = sessionStorage.getItem("fitmeals_applied_coupon");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { code: string };
        setSelectedCode(parsed.code);
      } catch { /* ignore */ }
    }
  }, []);

  const coupons = useQuery({
    queryKey: ["coupons-available"],
    queryFn: () => api<{ items: CouponItem[] }>("/api/v1/customer/coupons/available"),
    enabled: authed,
  });

  const previewCode = useMutation({
    mutationFn: (code: string) =>
      api<{ valid: boolean; message: string | null; discount: string | null }>(
        "/api/v1/customer/coupons/preview",
        { method: "POST", body: JSON.stringify({ code }) }
      ),
  });

  const applySelected = React.useCallback(
    async (code: string) => {
      try {
        const res = await previewCode.mutateAsync(code);
        if (res.valid && res.discount) {
          sessionStorage.setItem(
            "fitmeals_applied_coupon",
            JSON.stringify({ code: code.toUpperCase(), discount: Number(res.discount) })
          );
          setSelectedCode(code.toUpperCase());
        }
      } catch { /* ignore */ }
    },
    [previewCode]
  );

  function handleApplyAndGoBack() {
    router.push("/cart");
  }

  const items = coupons.data?.items ?? [];
  const shippingOffers = items.filter((c) => c.freeShipping);
  const orderOffers = items.filter((c) => !c.freeShipping);

  return (
    <KcalViewportShell>
      <div className="relative z-10 flex min-h-dvh flex-col bg-[#f7f8f7]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
          <Link
            href="/cart"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-slate-800" />
          </Link>
          <h1 className="flex-1 text-lg font-bold text-slate-900">Promotions</h1>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 px-4 pb-28 pt-4 lg:px-6 lg:pb-8">
          {/* Promo code input */}
          <div className="flex gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3">
              <Tag className="h-4 w-4 text-slate-400" />
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="flex-1 bg-transparent py-2.5 text-sm font-mono outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              disabled={!codeInput.trim() || previewCode.isPending}
              onClick={() => applySelected(codeInput.trim())}
              className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {previewCode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </button>
          </div>

          {previewCode.isError && (
            <p className="rounded-xl bg-rose-50 px-4 py-2 text-xs text-rose-600">
              {(previewCode.error as Error).message}
            </p>
          )}
          {previewCode.isSuccess && !previewCode.data.valid && (
            <p className="rounded-xl bg-rose-50 px-4 py-2 text-xs text-rose-600">
              {previewCode.data.message ?? "Invalid coupon"}
            </p>
          )}

          {/* Loading */}
          {coupons.isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          )}

          {/* Empty */}
          {coupons.data && items.length === 0 && (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <Tag className="mb-3 h-10 w-10 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-slate-800">No promotions available</p>
              <p className="mt-1 text-xs text-slate-500">Check back later for special offers</p>
            </div>
          )}

          {/* Shipping offers */}
          {shippingOffers.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-sm font-bold text-slate-700">Shipping Offers</h2>
              <div className="space-y-2.5">
                {shippingOffers.map((c) => (
                  <PromotionCard
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    code={c.code}
                    discountLabel={c.discountLabel}
                    description={c.description}
                    displayBadge={c.displayBadge}
                    applicable={c.applicable}
                    inapplicableReason={c.inapplicableReason}
                    selected={selectedCode === c.code}
                    onSelect={() => {
                      if (selectedCode === c.code) {
                        setSelectedCode(null);
                        sessionStorage.removeItem("fitmeals_applied_coupon");
                      } else {
                        applySelected(c.code);
                      }
                    }}
                    onInfo={() => setInfoCoupon(c)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Order offers */}
          {orderOffers.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-sm font-bold text-slate-700">Order Offers</h2>
              <div className="space-y-2.5">
                {orderOffers.map((c) => (
                  <PromotionCard
                    key={c.id}
                    id={c.id}
                    title={c.title}
                    code={c.code}
                    discountLabel={c.discountLabel}
                    description={c.description}
                    displayBadge={c.displayBadge}
                    applicable={c.applicable}
                    inapplicableReason={c.inapplicableReason}
                    selected={selectedCode === c.code}
                    onSelect={() => {
                      if (selectedCode === c.code) {
                        setSelectedCode(null);
                        sessionStorage.removeItem("fitmeals_applied_coupon");
                      } else {
                        applySelected(c.code);
                      }
                    }}
                    onInfo={() => setInfoCoupon(c)}
                  />
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Sticky apply bar */}
        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 lg:sticky lg:bottom-0">
            <div className="mx-auto max-w-kcal lg:max-w-none">
              <div
                className="mx-3 mb-3 lg:mx-0 lg:mb-0"
                style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom, 0px))" }}
              >
                <button
                  type="button"
                  onClick={handleApplyAndGoBack}
                  className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99]"
                >
                  {selectedCode ? `Apply ${selectedCode} & Continue` : "Continue without promotion"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info sheet */}
        <PromoInfoSheet coupon={infoCoupon} onClose={() => setInfoCoupon(null)} />
      </div>
    </KcalViewportShell>
  );
}
