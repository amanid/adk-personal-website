"use client";

import { Printer } from "lucide-react";
import { useLocale } from "next-intl";
import { buttonClass } from "@/components/ui/Button";

export default function PrintButton() {
  const fr = useLocale() === "fr";
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass("secondary", "md")}>
      <Printer aria-hidden className="w-4 h-4" />
      {fr ? "Imprimer" : "Print"}
    </button>
  );
}
