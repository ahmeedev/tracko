export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD — US Dollar" },
  { code: "PKR", symbol: "₨", label: "PKR — Pakistani Rupee" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function isAllowedCurrency(code: string): code is CurrencyCode {
  return CURRENCIES.some((c) => c.code === code);
}

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
