"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, MapPin, Plus, ShoppingBag, Tag } from "lucide-react";
import { Skeleton } from "@fitmeals/ui";
import { formatInr } from "@fitmeals/utils";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { openRazorpayModal } from "@/lib/razorpay-checkout";
import { KcalViewportShell } from "@/components/kcal/kcal-viewport-shell";
import { BasketItemCard } from "@/components/basket/basket-item-card";
import { SummarySelector } from "@/components/basket/summary-selector";
import { TotalsSummary } from "@/components/basket/totals-summary";
import { StickyCheckoutBar } from "@/components/basket/sticky-checkout-bar";

type CartItem = {
  id: string;
  quantity: number;
  unitPrice: string;
  meal: {
    id: string;
    name: string;
    slug: string;
    basePrice: string;
    compareAtPrice: string | null;
    coverUrl: string | null;
  };
};
type Cart = { id: string; items: CartItem[] };
type Address = {
  id: string;
  line1: string;
  city: string;
  label: string | null;
  isDefault: boolean;
};

export default function BasketPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [authed, setAuthed] = React.useState(false);
  const [appliedCoupon, setAppliedCoupon] = React.useState<{ code: string; discount: number } | null>(null);

  React.useEffect(() => {
    setAuthed(!!getAccessToken());
  }, []);

  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: () => api<Cart>("/api/v1/cart"),
    enabled: authed,
  });

  const addresses = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api<{ items: Address[] }>("/api/v1/customer/addresses"),
    enabled: authed,
  });

  const updateQty = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api(`/api/v1/cart/items/${id}`, { method: "PATCH", body: JSON.stringify({ quantity }) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: (id: string) => api(`/api/v1/cart/items/${id}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      const addr = addresses.data?.items.find((a) => a.isDefault) ?? addresses.data?.items[0];
      if (!addr) throw new Error("Add a delivery address first.");

      const checkout = await api<{
        orderId: string;
        razorpayOrderId: string | null;
        amountPaise?: number;
        keyId?: string | null;
        mock?: boolean;
      }>("/api/v1/checkout", {
        method: "POST",
        body: JSON.stringify({
          addressId: addr.id,
          payWith: "RAZORPAY",
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        }),
      });

      const verify = (payload: { razorpayOrderId: string; razorpayPaymentId: string; signature: string }) =>
        api("/api/v1/payments/razorpay/verify", {
          method: "POST",
          body: JSON.stringify({
            orderId: checkout.orderId,
            razorpayOrderId: payload.razorpayOrderId,
            razorpayPaymentId: payload.razorpayPaymentId,
            signature: payload.signature,
          }),
        });

      const useHosted = Boolean(checkout.razorpayOrderId && checkout.keyId && typeof checkout.amountPaise === "number");
      if (useHosted) {
        await openRazorpayModal({
          keyId: checkout.keyId as string,
          razorpayOrderId: checkout.razorpayOrderId as string,
          amountPaise: checkout.amountPaise as number,
          onSuccess: verify,
        });
      } else {
        await verify({
          razorpayOrderId: checkout.razorpayOrderId ?? "mock_order",
          razorpayPaymentId: "mock_pay",
          signature: "mock",
        });
      }
      return checkout.orderId;
    },
    onSuccess: (orderId) => {
      sessionStorage.removeItem("fitmeals_applied_coupon");
      router.push(`/orders/${orderId}`);
      // Invalidate cart after navigation so the user never sees a flash of empty cart
      setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ["cart"] });
        void qc.invalidateQueries({ queryKey: ["coupons-available"] });
      }, 500);
    },
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("fitmeals_applied_coupon");
    if (stored) {
      try {
        setAppliedCoupon(JSON.parse(stored) as { code: string; discount: number });
      } catch { /* ignore */ }
    }
  }, []);

  const items = cart.data?.items ?? [];
  const subtotal = items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const defaultAddr = addresses.data?.items.find((a) => a.isDefault) ?? addresses.data?.items[0];
  const isBusy = updateQty.isPending || removeItem.isPending;

  if (!authed) {
    return (
      <KcalViewportShell>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-white px-6">
          <ShoppingBag className="h-16 w-16 text-slate-200" />
          <p className="text-sm text-slate-500">Log in to view your basket</p>
          <Link href="/login" className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow">
            Log in
          </Link>
        </div>
      </KcalViewportShell>
    );
  }

  return (
    <KcalViewportShell>
      <div className="relative z-10 flex min-h-dvh flex-col bg-[#f7f8f7]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
          <Link
            href="/menu"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-slate-800" />
          </Link>
          <h1 className="flex-1 text-lg font-bold text-slate-900">My Basket</h1>
          <Link
            href="/menu"
            className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <Plus className="h-3.5 w-3.5" /> Add Items
          </Link>
        </header>

        {/* Body */}
        <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 pb-40 pt-4 lg:px-6 lg:pb-8">
          {cart.isLoading && (
            <div className="space-y-3" data-testid="basket-skeleton">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          )}

          {cart.data && items.length === 0 && (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center" data-testid="basket-empty">
              <ShoppingBag className="mb-4 h-14 w-14 text-slate-200" strokeWidth={1.5} />
              <p className="mb-1 text-sm font-semibold text-slate-800">Your basket is empty</p>
              <p className="mb-6 text-xs text-slate-500">Browse our healthy meals and add to basket</p>
              <Link
                href="/menu"
                className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20"
              >
                Browse Menu
              </Link>
            </div>
          )}

          {cart.isError && (
            <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-600" data-testid="basket-error">
              {(cart.error as Error).message}
            </p>
          )}

          {items.length > 0 && (
            <>
              <div className="space-y-3">
                {items.map((item) => (
                  <BasketItemCard
                    key={item.id}
                    id={item.id}
                    name={item.meal.name}
                    slug={item.meal.slug}
                    unitPrice={item.unitPrice}
                    compareAtPrice={item.meal.compareAtPrice}
                    coverUrl={item.meal.coverUrl}
                    quantity={item.quantity}
                    onQtyChange={(qty) => updateQty.mutate({ id: item.id, quantity: qty })}
                    onRemove={() => removeItem.mutate(item.id)}
                    disabled={isBusy}
                  />
                ))}
              </div>

              <div className="space-y-2.5">
                <SummarySelector
                  icon={MapPin}
                  label="Deliver to"
                  value={defaultAddr ? (defaultAddr.label ?? defaultAddr.line1) : "Add address"}
                  onClick={() => router.push("/locations")}
                />
                <SummarySelector icon={CreditCard} label="Payment method" value="Razorpay" />
                <SummarySelector
                  icon={Tag}
                  label="Promotions"
                  value={appliedCoupon ? appliedCoupon.code : "Select a promotion"}
                  badge={appliedCoupon ? `?${formatInr(appliedCoupon.discount)}` : null}
                  onClick={() => router.push("/promotions")}
                />
              </div>

              <TotalsSummary
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                discount={discount}
                total={total}
                couponCode={appliedCoupon?.code}
              />

              {placeOrder.isError && (
                <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
                  {(placeOrder.error as Error).message}
                </p>
              )}
            </>
          )}
        </main>

        {items.length > 0 && (
          <StickyCheckoutBar
            total={total}
            onPlaceOrder={() => placeOrder.mutate()}
            isPending={placeOrder.isPending}
          />
        )}
      </div>
    </KcalViewportShell>
  );
}
