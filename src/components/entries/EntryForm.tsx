"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/Field";
import { FileAttachmentField } from "@/components/ui/FileAttachmentField";
import { uploadAttachment } from "@/lib/storage";
import { todayISO } from "@/lib/format";
import type { Entry, EntryInput } from "@/lib/types";

const SUGGESTED_CATEGORIES = [
  "Design",
  "Development",
  "Software",
  "Travel",
  "Marketing",
  "Salaries",
  "Equipment",
  "Office",
  "Misc",
];

interface EntryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: EntryInput) => Promise<void>;
  currencySymbol: string;
  projectId: string;
  shareKey?: string;
  /** Provide to edit an existing entry; omit to add a new one. */
  entry?: Entry | null;
}

export function EntryForm({
  open,
  onClose,
  onSave,
  currencySymbol,
  projectId,
  shareKey,
  entry,
}: EntryFormProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [existingUrl, setExistingUrl] = useState<string | undefined>();
  const [existingName, setExistingName] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(entry ? String(entry.amount) : "");
    setCategory(entry?.category ?? "");
    setDate(entry?.date ?? todayISO());
    setNote(entry?.note ?? "");
    setFile(null);
    setExistingUrl(entry?.attachmentUrl);
    setExistingName(entry?.attachmentName);
    setError("");
  }, [open, entry]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountValue = Number(amount);
    if (Number.isNaN(amountValue) || amountValue <= 0)
      return setError("Enter an amount greater than 0.");
    if (!category.trim()) return setError("Pick or type a category.");
    if (!date) return setError("Choose a date.");

    setError("");
    setSaving(true);
    try {
      let attachmentUrl = existingUrl;
      let attachmentName = existingName;

      if (file) {
        const result = await uploadAttachment(projectId, "entries", file, shareKey);
        attachmentUrl = result.url;
        attachmentName = result.name;
      } else if (!existingUrl) {
        attachmentUrl = undefined;
        attachmentName = undefined;
      }

      await onSave({
        amount: amountValue,
        category: category.trim(),
        date,
        note: note.trim(),
        attachmentUrl,
        attachmentName,
      });
      onClose();
    } catch {
      setError("Couldn't save the entry. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry ? "Edit expense" : "Add expense"}
      description={
        entry ? "Update this expense entry." : "Log a new expense for this project."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="e-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                {currencySymbol}
              </span>
              <Input
                id="e-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className="pl-8"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="e-date">Date</Label>
            <Input
              id="e-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="e-category">Category</Label>
          <Input
            id="e-category"
            list="entry-categories"
            placeholder="e.g. Software"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
          <datalist id="entry-categories">
            {SUGGESTED_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="e-note">Note (optional)</Label>
          <Textarea
            id="e-note"
            placeholder="What was this expense for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div>
          <Label>Attachment (optional)</Label>
          <FileAttachmentField
            value={file}
            onChange={setFile}
            existingUrl={existingUrl}
            existingName={existingName}
            onClearExisting={() => { setExistingUrl(undefined); setExistingName(undefined); }}
          />
        </div>
        <FieldError>{error}</FieldError>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {entry ? "Save changes" : "Add expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
