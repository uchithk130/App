import { Suspense } from "react";
import { ForgotPasswordContent, ForgotPasswordFallback } from "./forgot-password-content";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordFallback />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
