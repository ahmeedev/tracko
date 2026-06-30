"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Optional footer (buttons). */
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-lg animate-[fadeIn_.15s_ease-out] rounded-t-3xl border border-line bg-surface shadow-[var(--shadow-card)] sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-stone-100 hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-line p-5 sm:p-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
