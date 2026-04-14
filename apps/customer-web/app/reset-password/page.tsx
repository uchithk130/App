import { Suspense } from "react";
import { ResetPasswordContent, ResetPasswordFallback } from "./reset-password-content";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
