import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";

interface BudgetBarProps {
  spent: number;
  budget: number;
  currency: string;
  className?: string;
  /** Hide the numeric summary above the bar. */
  compact?: boolean;
}

export function BudgetBar({
  spent,
  budget,
  currency,
  className,
  compact = false,
}: BudgetBarProps) {
  const ratio = budget > 0 ? spent / budget : spent > 0 ? 1 : 0;
  const pct = Math.min(ratio * 100, 100);
  const over = budget > 0 && spent > budget;
  const warn = !over && ratio >= 0.8;

  const barColor = over
    ? "bg-red-500"
    : warn
      ? "bg-amber-500"
      : "bg-gradient-to-r from-brand-400 to-brand-600";

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-ink">
            {formatCurrency(spent, currency)}
            <span className="font-medium text-muted">
              {" "}
              of {formatCurrency(budget, currency)}
            </span>
          </span>
          <span
            className={cn(
              "text-sm font-bold",
              over ? "text-red-600" : warn ? "text-amber-600" : "text-brand-600"
            )}
          >
            {budget > 0 ? `${Math.round(ratio * 100)}%` : "—"}
          </span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {over && !compact && (
        <p className="mt-1.5 text-xs font-semibold text-red-600">
          Over budget by {formatCurrency(spent - budget, currency)}
        </p>
      )}
    </div>
  );
}
