"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Copy, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toBibTeX, toAPA, toMLA, toChicago } from "@/lib/citations";
import type { PublicationData } from "@/types";

const FORMATS = [
  { key: "apa", label: "APA" },
  { key: "mla", label: "MLA" },
  { key: "chicago", label: "Chicago" },
  { key: "bibtex", label: "BibTeX" },
] as const;

type FormatKey = (typeof FORMATS)[number]["key"];

export default function CitationExport({ publication }: { publication: PublicationData }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<FormatKey>("apa");
  const [copied, setCopied] = useState(false);
  const fr = useLocale() === "fr";

  const generators: Record<FormatKey, (p: PublicationData) => string> = {
    apa: toAPA,
    mla: toMLA,
    chicago: toChicago,
    bibtex: toBibTeX,
  };

  const citation = generators[format](publication);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full min-h-11 flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--hover-wash)] transition-colors"
      >
        <span className="font-medium">{fr ? "Citer ce document" : "Cite this document"}</span>
        <ChevronDown aria-hidden className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div role="group" aria-label={fr ? "Format de citation" : "Citation format"} className="flex flex-wrap gap-1">
            {FORMATS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={format === f.key}
                onClick={() => setFormat(f.key)}
                className={cn(
                  "min-h-11 md:min-h-9 px-3 text-sm font-mono rounded-[var(--radius-sm)] transition-colors",
                  format === f.key
                    ? "bg-gold/10 text-gold"
                    : "text-text-secondary hover:text-text-primary hover:bg-[var(--hover-wash)]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <pre className="bg-navy rounded-[var(--radius-sm)] border border-glass-border p-4 pr-14 text-sm text-text-secondary whitespace-pre-wrap break-words font-mono">
              {citation}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-1.5 right-1.5 w-11 h-11 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:text-gold hover:bg-[var(--hover-wash)] transition-colors"
              aria-label={copied ? (fr ? "Citation copiée" : "Citation copied") : fr ? "Copier la citation" : "Copy citation"}
            >
              {copied ? <Check aria-hidden className="w-4 h-4 text-success" /> : <Copy aria-hidden className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
