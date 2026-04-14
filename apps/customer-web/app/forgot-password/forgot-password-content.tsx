"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { WellnessAuthShell } from "@/components/auth/wellness-auth-shell";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthPageHeading } from "@/components/auth/auth-page-heading";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { AuthPrimaryButton } from "@/components/auth/auth-primary-button";
import { API_BASE } from "@/lib/config";

const schema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
});

type Form = z.infer<typeof schema>;

export function ForgotPasswordContent() {
  const [done, setDone] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [devToken, setDevToken] = React.useState<string | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <WellnessAuthShell asideCaption="We’ll email a secure link to reset your password — your account stays protected.">
      <AuthBackLink href="/login">Back to log in</AuthBackLink>

      {done ? (
        <>
          <AuthPageHeading
            title="Check your inbox"
            subtitle="If an account exists for that email, we’ve sent reset instructions. Follow the link within the next hour."
          />
          {process.env.NODE_ENV === "development" && devToken ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-semibold">Development only</p>
              <p className="mt-1 break-all font-mono text-xs">Token: {devToken}</p>
              <p className="mt-2">
                Open{" "}
                <Link href={`/reset-password?token=${encodeURIComponent(devToken)}`} className="font-semibold underline">
                  reset password
                </Link>{" "}
                with this token.
              </p>
            </div>
          ) : null}
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-pill border border-slate-200 bg-white py-3.5 text-center text-base font-semibold text-emerald-800 shadow-sm transition hover:bg-slate-50"
          >
            Return to log in
          </Link>
        </>
      ) : (
        <>
          <AuthPageHeading
            title="Forgot password"
            subtitle="Enter the email you use for FitMeals. We’ll send a reset link if we find a matching account."
          />

          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit(async (values) => {
              setFormError(null);
              const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: values.email.trim().toLowerCase() }),
              });
              const data = (await res.json()) as { ok?: boolean; error?: string; devResetToken?: string };
              if (!res.ok) {
                setFormError(data.error ?? "Something went wrong. Try again.");
                return;
              }
              if (process.env.NODE_ENV === "development" && data.devResetToken) {
                setDevToken(data.devResetToken);
              }
              setDone(true);
            })}
          >
            <AuthTextField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              error={errors.email?.message}
              {...register("email")}
            />

            {formError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {formError}
              </p>
            ) : null}

            <AuthPrimaryButton loading={isSubmitting}>Send reset link</AuthPrimaryButton>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Remembered your password?{" "}
            <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
              Log in
            </Link>
          </p>
        </>
      )}
    </WellnessAuthShell>
  );
}

export function ForgotPasswordFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-emerald-50/50">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
    </div>
  );
}
