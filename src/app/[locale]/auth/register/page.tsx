"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Mail, Lock, User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/validations";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (res.ok) {
        router.push("/auth/login");
      } else {
        const result = await res.json();
        setError(result.error || "Registration failed");
      }
    } catch {
      setError("Something went wrong");
    }
  };

  const field =
    "w-full min-h-11 pl-10 pr-4 rounded-[var(--radius-md)] bg-navy border border-glass-border text-text-primary focus:border-gold focus:outline-none transition-colors";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl leading-tight tracking-tight">{t("register_title")}</h1>
            <p className="text-text-secondary mt-2">{t("register_subtitle")}</p>
          </div>

          {error && (
            <div role="alert" className="mb-5 p-3 rounded-[var(--radius-md)] bg-danger/10 border border-danger/30 text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="reg-name" className="block text-sm text-text-secondary mb-1.5">
                {t("name")}
              </label>
              <div className="relative">
                <User aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  {...register("name")}
                  id="reg-name"
                  autoComplete="name"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "reg-name-error" : undefined}
                  className={field}
                />
              </div>
              {errors.name && (
                <p id="reg-name-error" className="text-danger text-sm mt-1.5">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-sm text-text-secondary mb-1.5">
                {t("email")}
              </label>
              <div className="relative">
                <Mail aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  {...register("email")}
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "reg-email-error" : undefined}
                  className={field}
                />
              </div>
              {errors.email && (
                <p id="reg-email-error" className="text-danger text-sm mt-1.5">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-sm text-text-secondary mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <Lock aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  {...register("password")}
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? "reg-password-error" : undefined}
                  className={field}
                />
              </div>
              {errors.password && (
                <p id="reg-password-error" className="text-danger text-sm mt-1.5">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="reg-confirmPassword" className="block text-sm text-text-secondary mb-1.5">
                {t("confirm_password")}
              </label>
              <div className="relative">
                <Lock aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  {...register("confirmPassword")}
                  id="reg-confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={errors.confirmPassword ? true : undefined}
                  aria-describedby={errors.confirmPassword ? "reg-confirmPassword-error" : undefined}
                  className={field}
                />
              </div>
              {errors.confirmPassword && (
                <p id="reg-confirmPassword-error" className="text-danger text-sm mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              {!isSubmitting && <UserPlus aria-hidden="true" className="w-4 h-4" />}
              {t("register_button")}
            </Button>
          </form>

          <p className="mt-8 text-center text-text-secondary text-sm">
            {t("has_account")}{" "}
            <Link href="/auth/login" className="inline-flex items-center min-h-11 text-gold hover:text-gold-light underline-offset-4 hover:underline">
              {t("login_button")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
