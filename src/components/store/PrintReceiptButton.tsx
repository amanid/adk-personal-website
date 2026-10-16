"use client";

import { Printer } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

export default function PrintReceiptButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={buttonClass("secondary", "md", "print:hidden")}
    >
      <Printer aria-hidden="true" className="w-4 h-4" />
      {label}
    </button>
  );
}
