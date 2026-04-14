"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { WellnessAuthShell } from "@/components/auth/wellness-auth-shell";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthPageHeading } from "@/components/auth/auth-page-heading";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { AuthPasswordField } from "@/components/auth/auth-password-field";
import { AuthPrimaryButton } from "@/components/auth/auth-primary-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFooterLinkRow } from "@/components/auth/auth-footer-links";
import { API_BASE } from "@/lib/config";
import { setTokens } from "@/lib/auth-store";
import { safeAuthRedirect } from "@/lib/auth-redirect";

const schema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type Form = z.infer<typeof schema>;

export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeAuthRedirect(searchParams.get("redirect"));

  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <WellnessAuthShell asideCaption="Welcome back — pick up where you left off with meals that match your goals.">
      <AuthBackLink href="/welcome">Back</AuthBackLink>

      <AuthPageHeading
        title="Log in"
        subtitle="Use your account email and password. We’ll keep your session secure."
      />

      <form
        className="flex flex-col gap-5"
        data-testid="customer-login-form"
        onSubmit={handleSubmit(async (values) => {
          setFormError(null);
          const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ ...values, app: "customer" }),
          });
          const data = (await res.json()) as { accessToken?: string; refreshToken?: string; error?: string };
          if (!res.ok) {
            setFormError(data.error ?? "Couldn’t sign you in. Check your details and try again.");
            return;
          }
          if (data.accessToken) {
            setTokens(data.accessToken, data.refreshToken);
            router.push(redirectTo);
            router.refresh();
          }
        })}
      >
        <AuthTextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          data-testid="customer-email"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-emerald-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <AuthPasswordField
            id="password"
            autoComplete="current-password"
            data-testid="customer-password"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        {formError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {formError}
          </p>
        ) : null}

        <AuthPrimaryButton loading={isSubmitting} data-testid="customer-login-submit">
          Log in
        </AuthPrimaryButton>
      </form>

      <AuthDivider label="new here" />

      <AuthFooterLinkRow prompt="Don’t have an account?" href="/register" linkLabel="Create one" />

      <p className="mt-6 text-center text-xs text-slate-400">
        More sign-in options (Apple, Google) may arrive later — email stays primary.
      </p>
    </WellnessAuthShell>
  );
}

export function LoginFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-emerald-50/50">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
    </div>
  );
}
