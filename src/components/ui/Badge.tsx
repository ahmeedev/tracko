import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "brand" | "neutral" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  neutral: "bg-stone-100 text-stone-600 border-stone-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  danger: "bg-red-50 text-red-700 border-red-100",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
