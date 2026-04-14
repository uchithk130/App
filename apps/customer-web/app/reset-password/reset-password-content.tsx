"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { WellnessAuthShell } from "@/components/auth/wellness-auth-shell";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthPageHeading } from "@/components/auth/auth-page-heading";
import { AuthPasswordField } from "@/components/auth/auth-password-field";
import { AuthPrimaryButton } from "@/components/auth/auth-primary-button";
import { API_BASE } from "@/lib/config";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Form = z.infer<typeof schema>;

export function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formError, setFormError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  if (!token) {
    return (
      <WellnessAuthShell>
        <AuthBackLink href="/forgot-password">Request a new link</AuthBackLink>
        <AuthPageHeading
          title="Invalid or missing link"
          subtitle="Password reset links include a token in the URL. Open the link from your email, or request a new reset."
        />
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex w-full items-center justify-center rounded-pill bg-emerald-500 px-6 py-3.5 text-center text-base font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600"
        >
          Forgot password
        </Link>
      </WellnessAuthShell>
    );
  }

  if (done) {
    return (
      <WellnessAuthShell asideCaption="You’re all set — sign in with your new password whenever you’re ready.">
        <AuthPageHeading
          title="Password updated"
          subtitle="Your password has been reset. Use your new credentials to log in."
        />
        <Link
          href="/login"
          className="mt-8 inline-flex w-full items-center justify-center rounded-pill bg-emerald-500 px-6 py-3.5 text-center text-base font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600"
        >
          Go to log in
        </Link>
      </WellnessAuthShell>
    );
  }

  return (
    <WellnessAuthShell asideCaption="Choose a strong password — you’ll use it with your email to access FitMeals.">
      <AuthBackLink href="/login">Back to log in</AuthBackLink>

      <AuthPageHeading
        title="Set a new password"
        subtitle="Enter and confirm your new password. This will sign out other sessions for security."
      />

      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(async (values) => {
          setFormError(null);
          const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ token, password: values.password }),
          });
          const data = (await res.json()) as { ok?: boolean; error?: string };
          if (!res.ok) {
            setFormError(data.error ?? "Couldn’t reset your password. The link may have expired — request a new one.");
            return;
          }
          setDone(true);
        })}
      >
        <AuthPasswordField
          id="password"
          label="New password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <AuthPasswordField
          id="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {formError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {formError}
          </p>
        ) : null}

        <AuthPrimaryButton loading={isSubmitting}>Update password</AuthPrimaryButton>
      </form>
    </WellnessAuthShell>
  );
}

export function ResetPasswordFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-emerald-50/50">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
    </div>
  );
}
