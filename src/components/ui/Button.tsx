import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-[var(--shadow-brand)] focus-visible:ring-brand-300",
  secondary:
    "bg-ink text-white hover:bg-ink-soft focus-visible:ring-stone-400",
  outline:
    "border border-line bg-surface text-ink hover:bg-brand-50 hover:border-brand-200 focus-visible:ring-brand-200",
  ghost:
    "bg-transparent text-ink-soft hover:bg-brand-50 hover:text-brand-700 focus-visible:ring-brand-200",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", loading, children, disabled, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold",
          "transition-all duration-150 focus:outline-none focus-visible:ring-4",
          "disabled:opacity-60 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
