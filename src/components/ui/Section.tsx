import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Reveal from "./Reveal";

const widths = {
  prose: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
} as const;

export function Container({
  size = "default",
  className,
  children,
}: {
  size?: keyof typeof widths;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(widths[size], "mx-auto px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

/**
 * A page section with the house header: a numbered mono eyebrow, a serif
 * title and an optional intro, left-aligned. Sections are separated by a
 * hairline rather than alternating background bands.
 */
export function Section({
  id,
  index,
  eyebrow,
  title,
  intro,
  action,
  size,
  className,
  children,
}: {
  id?: string;
  /** Shown as "01 — Eyebrow". */
  index?: number;
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  /** A link or button aligned with the title, e.g. "View all". */
  action?: ReactNode;
  size?: keyof typeof widths;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("py-20 md:py-28 hairline first:border-t-0", className)}>
      <Container size={size}>
        {(eyebrow || title) && (
          <Reveal className="mb-12 md:mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              {eyebrow && (
                <p className="eyebrow mb-4">
                  {index !== undefined && <span className="text-text-muted">{String(index).padStart(2, "0")} — </span>}
                  {eyebrow}
                </p>
              )}
              {title && <h2 className="h-section">{title}</h2>}
              {intro && <p className="lede mt-4">{intro}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </Reveal>
        )}
        {children}
      </Container>
    </section>
  );
}
