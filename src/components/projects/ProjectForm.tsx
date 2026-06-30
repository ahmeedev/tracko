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
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset the form whenever the modal opens or the target project changes.
  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? "");
    setDescription(project?.description ?? "");
    setBudget(project ? String(project.budget) : "");
    setCurrency(project?.currency ?? "USD");
    setError("");
  }, [open, project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const budgetValue = Number(budget);
    if (!name.trim()) return setError("Give your project a name.");
    if (Number.isNaN(budgetValue) || budgetValue < 0)
      return setError("Budget must be a number of 0 or more.");

    setError("");
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        budget: budgetValue,
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
          ? "Update the project details and budget."
          : "Create a project and Tracko will generate a share key for it."
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="p-budget">Budget</Label>
            <Input
              id="p-budget"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
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
