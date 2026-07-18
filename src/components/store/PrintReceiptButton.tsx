"use client";

import { Printer } from "lucide-react";

export default function PrintReceiptButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-glass-border text-sm hover:border-gold/50 hover:text-gold transition-all"
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
