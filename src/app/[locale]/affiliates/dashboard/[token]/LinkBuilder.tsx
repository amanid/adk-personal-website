"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check } from "lucide-react";

function CopyRow({
  value,
  copied,
  onCopy,
  labels,
}: {
  value: string;
  copied: boolean;
  onCopy: (v: string) => void;
  labels: [string, string];
}) {
  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={value}
        className="flex-1 min-w-0 px-3 py-2 rounded-md bg-navy/50 border border-glass-border text-sm figure"
        onFocus={(e) => e.target.select()}
      />
      <button type="button" onClick={() => onCopy(value)} className="px-3 py-2 rounded-md border border-glass-border text-sm inline-flex items-center gap-1 shrink-0">
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        {copied ? labels[1] : labels[0]}
      </button>
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
    <div className="glass p-5 space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">{t("your_link")}</p>
        <CopyRow value={home} copied={copied === home} onCopy={copy} labels={[t("copy"), t("copied")]} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{t("link_builder")}</p>
        <p className="text-xs text-text-muted mb-2">{t("link_builder_help")}</p>
        <select value={path} onChange={(e) => setPath(e.target.value)} className="w-full mb-2 px-3 py-2 rounded-md bg-navy/50 border border-glass-border text-sm">
          {targets.map((x) => (
            <option key={x.path} value={x.path}>
              {x.label}
            </option>
          ))}
        </select>
        <CopyRow value={deep} copied={copied === deep} onCopy={copy} labels={[t("copy"), t("copied")]} />
      </div>
    </div>
  );
}
