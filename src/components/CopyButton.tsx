"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); fail quietly.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-600" /> Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" /> {label}
        </>
      )}
    </button>
  );
}
