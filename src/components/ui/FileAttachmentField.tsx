"use client";

import { useRef, useState } from "react";
import { Paperclip, X, FileText } from "lucide-react";
import { cn } from "@/lib/cn";

interface FileAttachmentFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string;
  existingName?: string;
  onClearExisting?: () => void;
}

export function FileAttachmentField({
  value,
  onChange,
  existingUrl,
  existingName,
  onClearExisting,
}: FileAttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    onChange(files[0]);
  }

  if (existingUrl && existingName && !value) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line bg-stone-50 px-3 py-2.5">
        <FileText className="size-4 shrink-0 text-brand-500" />
        <a
          href={existingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-sm font-medium text-brand-700 hover:underline"
        >
          {existingName}
        </a>
        {onClearExisting && (
          <button
            type="button"
            aria-label="Remove attachment"
            onClick={onClearExisting}
            className="shrink-0 rounded p-0.5 text-muted hover:text-red-600"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">
        <FileText className="size-4 shrink-0 text-brand-500" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand-700">
          {value.name}
        </span>
        <button
          type="button"
          aria-label="Remove file"
          onClick={() => onChange(null)}
          className="shrink-0 rounded p-0.5 text-muted hover:text-red-600"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 transition-colors",
        dragOver
          ? "border-brand-400 bg-brand-50"
          : "border-line bg-stone-50 hover:border-brand-300 hover:bg-brand-50/50"
      )}
    >
      <Paperclip className="size-4 shrink-0 text-muted" />
      <span className="text-sm text-muted">
        Attach a file <span className="text-xs">(optional)</span>
      </span>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
