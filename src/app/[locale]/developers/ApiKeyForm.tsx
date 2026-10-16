"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { postJson } from "@/components/payments/PaymentPanel";
import { Button } from "@/components/ui/Button";

const input =
  "w-full min-h-11 px-4 py-2.5 rounded-[var(--radius-md)] bg-navy border border-glass-border text-text-primary text-sm " +
  "placeholder:text-text-muted focus:border-gold focus:outline-none transition-colors";
const labelCls = "block text-sm text-text-secondary mb-1.5";

export default function ApiKeyForm() {
  const t = useTranslations("developers");
  const [f, setF] = useState({ name: "", email: "", useCase: "", agree: false });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p role="status" className="card p-5 text-sm flex gap-3 max-w-xl">
        <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-hidden />
        {t("sent")}
      </p>
    );
  }
  return (
    <form
      className="card p-6 md:p-8 space-y-5 max-w-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await postJson("/api/developers/keys", { ...f, agree: f.agree || undefined }, t("error"));
          setDone(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : t("error"));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="api-name" className={labelCls}>
            {t("name")}
          </label>
          <input
            id="api-name"
            required
            autoComplete="name"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="api-email" className={labelCls}>
            {t("email")}
          </label>
          <input
            id="api-email"
            required
            type="email"
            autoComplete="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            className={input}
          />
        </div>
      </div>
      <div>
        <label htmlFor="api-usecase" className={labelCls}>
          {t("use_case")}
        </label>
        <textarea
          id="api-usecase"
          required
          rows={3}
          value={f.useCase}
          onChange={(e) => setF({ ...f, useCase: e.target.value })}
          className={`${input} resize-y`}
        />
      </div>
      <label htmlFor="api-agree" className="flex items-start gap-3 text-sm min-h-11 cursor-pointer">
        <input
          id="api-agree"
          type="checkbox"
          required
          checked={f.agree}
          onChange={(e) => setF({ ...f, agree: e.target.checked })}
          className="mt-0.5 w-5 h-5 accent-gold shrink-0"
        />
        {t("agree")}
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-[var(--radius-md)] p-3">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={busy}>
        {busy ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
