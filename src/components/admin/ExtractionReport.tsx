"use client";

import { useState } from "react";
import { FileSearch, Sparkles, CheckCircle2, ShieldCheck, ChevronDown, Loader2, Info, Scissors } from "lucide-react";
import type { ReportRow, Removal } from "@/lib/listing-fill";

export interface ExtractionState {
  phase: "reading" | "drafting" | "done";
  rows: ReportRow[];
  missing: string[];
  notes: string[];
  removed: Removal[];
  droppedTranslations: string[];
  figuresChecked: number;
  error?: string;
  aiError?: string;
}

const STATUS: Record<ReportRow["status"], { label: string; className: string }> = {
  filled: { label: "Filled", className: "text-green-400" },
  confirmed: { label: "Matches", className: "text-text-secondary" },
  kept: { label: "Kept yours", className: "text-amber-400" },
  "kept-file": { label: "Kept the file's", className: "text-text-secondary" },
  drafted: { label: "AI draft", className: "text-gold" },
  translated: { label: "Translated", className: "text-gold" },
};

/**
 * What the editor took from an uploaded file: each value, where it came
 * from, the exact text it was read from, and what the checks removed.
 */
export default function ExtractionReport({ state }: { state: ExtractionState }) {
  const [open, setOpen] = useState(true);
  const filled = state.rows.filter((r) => r.status !== "kept" && r.status !== "kept-file" && r.status !== "confirmed").length;
  const busy = state.phase !== "done";

  return (
    <div className="glass rounded-lg p-4 text-sm space-y-3" aria-live="polite">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 text-left">
        {busy ? <Loader2 className="w-4 h-4 text-gold animate-spin" /> : <FileSearch className="w-4 h-4 text-gold" />}
        <span className="font-medium flex-1">
          {state.phase === "reading" && "Reading the file…"}
          {state.phase === "drafting" && `Read the file (${filled} field${filled === 1 ? "" : "s"} filled). Drafting the listing from its text…`}
          {state.phase === "done" && `From the file: ${filled} field${filled === 1 ? "" : "s"} filled — review them below, nothing is saved until you press Save.`}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {state.error && <p className="text-red-400">{state.error}</p>}
          {state.rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-text-muted">
                    <th className="py-1 pr-3 font-medium">Field</th>
                    <th className="py-1 pr-3 font-medium">Value</th>
                    <th className="py-1 pr-3 font-medium">Source</th>
                    <th className="py-1 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((r, i) => (
                    <tr key={`${r.field}-${i}`} className="border-t border-glass-border/60 align-top">
                      <td className="py-1.5 pr-3 whitespace-nowrap">{r.field}</td>
                      <td className="py-1.5 pr-3 max-w-xs">
                        <span className="line-clamp-2 whitespace-pre-line">{r.value}</span>
                        {r.evidence && (
                          <span className="block text-text-muted mt-0.5">
                            from: “<span className="italic">{r.evidence.length > 140 ? `${r.evidence.slice(0, 140)}…` : r.evidence}</span>”
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 text-text-secondary">{r.source}</td>
                      <td className={`py-1.5 whitespace-nowrap ${STATUS[r.status].className}`}>{STATUS[r.status].label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {state.missing.length > 0 && (
            <p className="text-xs text-text-secondary flex gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Not found in the file, so left as is: {state.missing.join(", ")}.
            </p>
          )}
          {state.notes.map((n) => (
            <p key={n} className="text-xs text-text-secondary flex gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {n}
            </p>
          ))}

          {(state.figuresChecked > 0 || state.removed.length > 0) && (
            <div className="text-xs space-y-1">
              <p className="flex gap-1.5 text-text-secondary">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-400" />
                The AI draft was checked against the document: {state.figuresChecked} figure{state.figuresChecked === 1 ? "" : "s"} kept, all present in the text
                {state.removed.length ? `; ${state.removed.length} statement${state.removed.length === 1 ? "" : "s"} removed because the document doesn't support ${state.removed.length === 1 ? "it" : "them"}:` : "."}
              </p>
              {state.removed.map((r, i) => (
                <p key={i} className="flex gap-1.5 pl-5 text-text-muted">
                  <Scissors className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    <span className="line-through">{r.text.length > 160 ? `${r.text.slice(0, 160)}…` : r.text}</span> — {r.reason}
                  </span>
                </p>
              ))}
              {state.droppedTranslations.length > 0 && (
                <p className="pl-5 text-text-muted">
                  Translation not used for: {state.droppedTranslations.join(", ")} (its figures didn&apos;t match the original).
                </p>
              )}
            </div>
          )}
          {state.aiError && (
            <p className="text-xs text-amber-400 flex gap-1.5">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {state.aiError}
            </p>
          )}
          {state.phase === "done" && !state.error && state.rows.length > 0 && (
            <p className="text-xs text-text-muted flex gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Fields you had already filled were left alone; the file&apos;s value is shown as “Kept yours”.
            </p>
          )}
        </>
      )}
    </div>
  );
}
