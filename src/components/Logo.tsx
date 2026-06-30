import Link from "next/link";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

export function Logo({
  href = "/",
  className,
  showText = true,
}: {
  href?: string;
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-brand)] transition-transform group-hover:scale-105">
        <Wallet className="size-5" strokeWidth={2.5} />
      </span>
      {showText && (
        <span className="text-xl font-extrabold tracking-tight text-ink">
          Track<span className="text-brand-600">o</span>
        </span>
      )}
    </Link>
  );
}
