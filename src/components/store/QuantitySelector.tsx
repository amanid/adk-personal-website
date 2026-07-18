"use client";

import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
}: QuantitySelectorProps) {
  const btn =
    size === "sm"
      ? "w-7 h-7"
      : "w-9 h-9";

  return (
    <div className="inline-flex items-center rounded-lg border border-glass-border overflow-hidden">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={`${btn} flex items-center justify-center text-text-secondary hover:text-gold hover:bg-gold/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
      >
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Quantity"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isNaN(n)) return;
          onChange(Math.min(max, Math.max(min, n)));
        }}
        className="w-12 text-center bg-transparent text-sm font-medium outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`${btn} flex items-center justify-center text-text-secondary hover:text-gold hover:bg-gold/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
