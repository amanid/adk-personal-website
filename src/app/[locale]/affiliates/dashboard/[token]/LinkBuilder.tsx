"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

function CopyRow({
  id,
  ariaLabel,
  value,
  copied,
  onCopy,
  labels,
}: {
  id: string;
  ariaLabel?: string;
  value: string;
  copied: boolean;
  onCopy: (v: string) => void;
  labels: [string, string];
}) {
  return (
    <div className="flex gap-2">
      <input
        id={id}
        aria-label={ariaLabel}
        readOnly
        value={value}
        className="flex-1 min-w-0 min-h-11 px-4 rounded-[var(--radius-md)] bg-navy border border-glass-border text-sm font-mono focus:border-gold focus:outline-none"
        onFocus={(e) => e.target.select()}
      />
      <Button type="button" variant="secondary" onClick={() => onCopy(value)} className="shrink-0">
        {copied ? <Check className="w-4 h-4 text-success" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
        <span aria-live="polite">{copied ? labels[1] : labels[0]}</span>
      </Button>
    </div>
  );
}

/** The affiliate's referral link, and a builder for links to any title. */
export default function LinkBuilder({
  base,
  code,
  targets,
}: {
  base: string;
  code: string;
  targets: { label: string; path: string }[];
}) {
  const t = useTranslations("affiliate");
  const [path, setPath] = useState(targets[0]?.path ?? "/");
  const [copied, setCopied] = useState<string | null>(null);
  const origin = base || (typeof window !== "undefined" ? window.location.origin : "");
  const home = `${origin}/r/${code}`;
  const deep = `${origin}/r/${code}?to=${encodeURIComponent(path)}`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="card p-5 md:p-6 space-y-6">
      <div>
        <label htmlFor="aff-link-home" className="block text-sm font-medium mb-2">
          {t("your_link")}
        </label>
        <CopyRow id="aff-link-home" value={home} copied={copied === home} onCopy={copy} labels={[t("copy"), t("copied")]} />
      </div>
      <div>
        <label htmlFor="aff-link-target" className="block text-sm font-medium mb-1">
          {t("link_builder")}
        </label>
        <p id="aff-link-help" className="text-sm text-text-muted mb-2">{t("link_builder_help")}</p>
        <select
          id="aff-link-target"
          aria-describedby="aff-link-help"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="w-full mb-2 min-h-11 px-4 rounded-[var(--radius-md)] bg-navy border border-glass-border text-sm focus:border-gold focus:outline-none"
        >
          {targets.map((x) => (
            <option key={x.path} value={x.path}>
              {x.label}
            </option>
          ))}
        </select>
        <CopyRow id="aff-link-deep" ariaLabel={t("link_builder")} value={deep} copied={copied === deep} onCopy={copy} labels={[t("copy"), t("copied")]} />
      </div>
    </div>
  );
}
