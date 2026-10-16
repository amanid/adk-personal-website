"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Mail, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { safeRedirectPath } from "@/lib/utils";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Where to go after signing in: a same-site path from ?callbackUrl= only
  // (never another origin), else the home page.
  const nextPath = () => {
    const raw = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("callbackUrl") : null;
    return safeRedirectPath(raw);
  };

  const onSubmit = async (data: LoginInput) => {
    setError("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push(nextPath());
      router.refresh();
    }
  };

  const field =
    "w-full min-h-11 pl-10 pr-4 rounded-[var(--radius-md)] bg-navy border border-glass-border text-text-primary focus:border-gold focus:outline-none transition-colors";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl leading-tight tracking-tight">{t("login_title")}</h1>
            <p className="text-text-secondary mt-2">{t("login_subtitle")}</p>
          </div>

          {error && (
            <div role="alert" className="mb-5 p-3 rounded-[var(--radius-md)] bg-danger/10 border border-danger/30 text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm text-text-secondary mb-1.5">
                {t("email")}
              </label>
              <div className="relative">
                <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  {...register("email")}
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "login-email-error" : undefined}
                  className={field}
                />
              </div>
              {errors.email && (
                <p id="login-email-error" className="text-danger text-sm mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm text-text-secondary mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <Lock aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  {...register("password")}
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  className={field}
                />
              </div>
              {errors.password && (
                <p id="login-password-error" className="text-danger text-sm mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              {!isSubmitting && <LogIn aria-hidden="true" className="w-4 h-4" />}
              {t("login_button")}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-text-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-glass-border" />
            {t("or")}
            <span className="h-px flex-1 bg-glass-border" />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full mt-6"
            onClick={() => signIn("google", { callbackUrl: nextPath() })}
          >
            {t("google")}
          </Button>

          <p className="mt-8 text-center text-text-secondary text-sm">
            {t("no_account")}{" "}
            <Link href="/auth/register" className="inline-flex items-center min-h-11 text-gold hover:text-gold-light underline-offset-4 hover:underline">
              {t("register_button")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
