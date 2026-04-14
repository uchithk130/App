import { Suspense } from "react";
import { RegisterContent, RegisterFallback } from "./register-content";

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterContent />
    </Suspense>
  );
}
