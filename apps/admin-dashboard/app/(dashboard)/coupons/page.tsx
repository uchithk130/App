import { Suspense } from "react";
import { CouponsContent } from "./coupons-content";

export default function AdminCouponsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading coupons…</div>}>
      <CouponsContent />
    </Suspense>
  );
}
