"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = true,
}: ConfirmDialogProps) {
  const [working, setWorking] = useState(false);

  async function handleConfirm() {
    setWorking(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setWorking(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={destructive ? "danger" : "primary"}
          onClick={handleConfirm}
          loading={working}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
