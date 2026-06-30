"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/Field";
import { FileAttachmentField } from "@/components/ui/FileAttachmentField";
import { uploadAttachment } from "@/lib/storage";
import { todayISO } from "@/lib/format";
import type { BudgetEntry, BudgetEntryInput } from "@/lib/types";

interface BudgetEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: BudgetEntryInput) => Promise<void>;
  projectId: string;
  currencySymbol: string;
  entry?: BudgetEntry | null;
}

export function BudgetEntryForm({
  open,
  onClose,
  onSave,
  projectId,
  currencySymbol,
  entry,
}: BudgetEntryFormProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [file, setFile] = useState<File | null>(null);
  const [existingUrl, setExistingUrl] = useState<string | undefined>();
  const [existingName, setExistingName] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(entry ? String(entry.amount) : "");
    setNote(entry?.note ?? "");
    setDate(entry?.date ?? todayISO());
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
    if (!date) return setError("Choose a date.");

    setError("");
    setSaving(true);
    try {
      let attachmentUrl = existingUrl;
      let attachmentName = existingName;

      if (file) {
        const result = await uploadAttachment(projectId, "budgetEntries", file);
        attachmentUrl = result.url;
        attachmentName = result.name;
      } else if (!existingUrl) {
        attachmentUrl = undefined;
        attachmentName = undefined;
      }

      await onSave({
        amount: amountValue,
        note: note.trim(),
        date,
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
      title={entry ? "Edit budget entry" : "Add budget"}
      description={
        entry
          ? "Update this budget entry."
          : "Add to your personal budget for this project."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="b-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                {currencySymbol}
              </span>
              <Input
                id="b-amount"
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
            <Label htmlFor="b-date">Date</Label>
            <Input
              id="b-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="b-note">Note (optional)</Label>
          <Textarea
            id="b-note"
            placeholder="e.g. Initial project allocation"
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
            {entry ? "Save changes" : "Add budget"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
