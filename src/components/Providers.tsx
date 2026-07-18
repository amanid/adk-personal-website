"use client";

import { SessionProvider } from "next-auth/react";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "@/lib/ThemeContext";
import { CartProvider } from "@/lib/cart-context";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {/* Honor prefers-reduced-motion across all framer-motion animations. */}
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <CartProvider>{children}</CartProvider>
        </ThemeProvider>
      </MotionConfig>
    </SessionProvider>
  );
}
