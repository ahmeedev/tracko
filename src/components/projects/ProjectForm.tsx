"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { CURRENCIES } from "@/lib/format";
import type { Project, ProjectInput } from "@/lib/types";

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: ProjectInput) => Promise<void>;
  /** Provide to edit an existing project; omit to create a new one. */
  project?: Project | null;
}

export function ProjectForm({ open, onClose, onSave, project }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset the form whenever the modal opens or the target project changes.
  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? "");
    setDescription(project?.description ?? "");
    setCurrency(project?.currency ?? "USD");
    setError("");
  }, [open, project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Give your project a name.");

    setError("");
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        currency,
      });
      onClose();
    } catch {
      setError("Couldn't save the project. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? "Edit project" : "New project"}
      description={
        project
          ? "Update the project details."
          : "Create a project and Tracko will generate a share key for it. Budget is added afterwards from the Budget tab."
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="p-name">Project name</Label>
          <Input
            id="p-name"
            placeholder="e.g. Website Revamp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div>
          <Label htmlFor="p-desc">Description (optional)</Label>
          <Textarea
            id="p-desc"
            placeholder="A short note about what this project covers."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="p-currency">Currency</Label>
          <Select
            id="p-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <FieldError>{error}</FieldError>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {project ? "Save changes" : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
