"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/lib/ThemeContext";
import { CartProvider } from "@/lib/cart-context";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CartProvider>{children}</CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
