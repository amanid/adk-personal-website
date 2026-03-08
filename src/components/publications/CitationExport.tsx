"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
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
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gold/5 transition-colors"
      >
        <span className="font-medium">Cite This Publication</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex gap-1">
            {FORMATS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFormat(f.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  format === f.key
                    ? "bg-gold/20 text-gold font-medium"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <pre className="bg-navy/50 rounded-lg p-4 text-sm text-text-secondary whitespace-pre-wrap break-words font-mono">
              {citation}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-md glass hover:text-gold transition-colors"
              title="Copy citation"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
