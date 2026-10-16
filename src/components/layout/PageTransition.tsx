"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Start almost fully visible: server-rendered HTML must be readable before
// hydration, so the transition is a soft settle rather than a fade-in from 0.
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0.98, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
