import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-[var(--radius-md)] " +
  "transition-[background-color,border-color,color,box-shadow] duration-150 " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-gold text-charcoal hover:bg-gold-light shadow-[var(--elev-sm)]",
  secondary:
    "border border-glass-border text-text-primary hover:border-text-muted hover:bg-[var(--hover-wash)]",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-[var(--hover-wash)]",
};

// md and lg meet the 44px minimum tap target.
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

/** A button. Pass `loading` to disable it while keeping its label visible. */
export const Button = forwardRef<
  HTMLButtonElement,
  Common & ComponentProps<"button"> & { loading?: boolean }
>(function Button({ variant, size, className, loading, disabled, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
});

/** A link styled as a button, for in-app (locale-aware) navigation. */
export function ButtonLink({
  variant,
  size,
  className,
  children,
  ...rest
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
