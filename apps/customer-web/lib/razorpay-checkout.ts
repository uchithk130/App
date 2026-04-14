const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Razorpay is client-only"));
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = SCRIPT_SRC;
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => {
        scriptPromise = null;
        reject(new Error("Could not load Razorpay Checkout"));
      };
      document.body.appendChild(el);
    });
  }
  return scriptPromise;
}

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailed = { error?: { description?: string } };

export type RazorpayCheckoutInput = {
  keyId: string;
  razorpayOrderId: string;
  amountPaise: number;
  customerName?: string;
  customerEmail?: string;
  /** Called with Razorpay response; should call your verify API and throw on failure. */
  onSuccess: (p: { razorpayOrderId: string; razorpayPaymentId: string; signature: string }) => Promise<unknown>;
};

/** Opens Razorpay modal; resolves after `onSuccess` completes, rejects on cancel/failure/load error. */
export function openRazorpayModal(input: RazorpayCheckoutInput): Promise<void> {
  return loadRazorpayScript().then(() => {
    if (!window.Razorpay) return Promise.reject(new Error("Razorpay Checkout unavailable"));
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (fn: () => void) => {
          if (settled) return;
          settled = true;
          fn();
        };

        const options = {
          key: input.keyId,
          amount: input.amountPaise,
          currency: "INR" as const,
          name: "FitMeals",
          description: "Order payment",
          order_id: input.razorpayOrderId,
          handler(response: RazorpaySuccess) {
            input
              .onSuccess({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              })
              .then(() => finish(() => resolve()))
              .catch((e: unknown) =>
                finish(() => reject(e instanceof Error ? e : new Error(String(e))))
              );
          },
          modal: {
            ondismiss() {
              finish(() => reject(new Error("Payment cancelled")));
            },
          },
          prefill: {
            name: input.customerName ?? "",
            email: input.customerEmail ?? "",
          },
          theme: { color: "#0f172a" },
        };

        const Rz = window.Razorpay!;
        const rz = new Rz(options);
        rz.on("payment.failed", (res: unknown) => {
          const r = res as RazorpayFailed;
          finish(() => reject(new Error(r?.error?.description ?? "Payment failed")));
        });
        rz.open();
      });
  });
}
