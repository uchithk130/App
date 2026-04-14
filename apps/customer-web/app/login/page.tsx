import { Suspense } from "react";
import { LoginContent, LoginFallback } from "./login-content";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
