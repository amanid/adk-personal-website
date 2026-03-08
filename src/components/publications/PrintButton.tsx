"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm glass rounded-lg text-text-secondary hover:text-gold transition-colors"
      title="Print this page"
    >
      <Printer className="w-3.5 h-3.5" />
      Print
    </button>
  );
}
