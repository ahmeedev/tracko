export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD — US Dollar" },
  { code: "EUR", symbol: "€", label: "EUR — Euro" },
  { code: "GBP", symbol: "£", label: "GBP — British Pound" },
  { code: "PKR", symbol: "₨", label: "PKR — Pakistani Rupee" },
  { code: "INR", symbol: "₹", label: "INR — Indian Rupee" },
  { code: "AED", symbol: "د.إ", label: "AED — UAE Dirham" },
  { code: "CAD", symbol: "$", label: "CAD — Canadian Dollar" },
  { code: "AUD", symbol: "$", label: "AUD — Australian Dollar" },
] as const;

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

/** Formats an amount as currency, falling back gracefully for odd codes. */
export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Compact currency for tight spaces, e.g. $12.4k. */
export function formatCompact(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Today's date as a yyyy-mm-dd string for date inputs. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
