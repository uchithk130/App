"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { WellnessAuthShell } from "@/components/auth/wellness-auth-shell";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthPageHeading } from "@/components/auth/auth-page-heading";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { AuthPasswordField } from "@/components/auth/auth-password-field";
import { AuthPrimaryButton } from "@/components/auth/auth-primary-button";
import { AuthFooterLinkRow } from "@/components/auth/auth-footer-links";
import { API_BASE } from "@/lib/config";
import { setTokens } from "@/lib/auth-store";
import { safeAuthRedirect } from "@/lib/auth-redirect";
import { useGuestOnly } from "@/lib/use-guest-only";

const schema = z
  .object({
    fullName: z.string().min(1, "Enter your full name"),
    email: z.string().min(1, "Enter your email").email("Enter a valid email"),
    phone: z.string().trim(),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    termsAccepted: z.boolean().refine((v) => v === true, "Please accept the terms to continue"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    const digits = data.phone.replace(/\D/g, "");
    if (data.phone.trim() !== "" && (digits.length < 10 || digits.length > 15)) {
      ctx.addIssue({ code: "custom", message: "Enter a valid phone number (or leave blank)", path: ["phone"] });
    }
  });

type Form = z.infer<typeof schema>;

export function RegisterContent() {
const router = useRouter();
const searchParams = useSearchParams();
const redirectTo = safeAuthRedirect(searchParams.get("redirect"));
const redirecting = useGuestOnly(redirectTo);
if (redirecting) return null;

  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <WellnessAuthShell asideCaption="Create your profile — we’ll tailor meals and macros to how you actually live.">
      <AuthBackLink href="/welcome">Back</AuthBackLink>

      <AuthPageHeading
        title="Create account"
        subtitle="Join FitMeals with your details. You can refine preferences anytime in your profile."
      />

      <form
        className="flex flex-col gap-5"
        data-testid="customer-register-form"
        onSubmit={handleSubmit(async (values) => {
          setFormError(null);
          const phone = values.phone.trim();
          const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              fullName: values.fullName.trim(),
              email: values.email.trim().toLowerCase(),
              password: values.password,
              ...(phone ? { phone } : {}),
            }),
          });
          const data = (await res.json()) as { accessToken?: string; refreshToken?: string; error?: string; code?: string };
          if (!res.ok) {
            if (data.code === "ALREADY_CUSTOMER") {
              setFormError("A customer account with this email already exists. Please log in.");
            } else {
              setFormError(data.error ?? "Couldn’t create your account. Try again.");
            }
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
          id="fullName"
          label="Full name"
          autoComplete="name"
          data-testid="customer-fullname"
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <AuthTextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthTextField
          id="phone"
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="e.g. 98765 43210"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <AuthPasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <AuthPasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Controller
          name="termsAccepted"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30"
                  checked={field.value}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/support" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
                    terms & privacy
                  </Link>{" "}
                  for using FitMeals.
                </span>
              </label>
              {errors.termsAccepted ? (
                <p className="text-sm text-red-600" role="alert">
                  {errors.termsAccepted.message}
                </p>
              ) : null}
            </div>
          )}
        />

        {formError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {formError}
          </p>
        ) : null}

        <AuthPrimaryButton loading={isSubmitting} data-testid="customer-register-submit">
          Create account
        </AuthPrimaryButton>
      </form>

      <div className="mt-8">
        <AuthFooterLinkRow prompt="Already have an account?" href="/login" linkLabel="Log in" />
      </div>
    </WellnessAuthShell>
  );
}

export function RegisterFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-emerald-50/50">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
    </div>
  );
}
