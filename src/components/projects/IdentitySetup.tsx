"use client";

import { useState } from "react";
import { UserCircle2 } from "lucide-react";
import { MEMBER_COLORS, createIdentity, saveIdentity } from "@/lib/identity";
import type { UserIdentity } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Field";

interface IdentitySetupProps {
  projectId: string;
  onDone: (identity: UserIdentity) => void;
}

export function IdentitySetup({ projectId, onDone }: IdentitySetupProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(MEMBER_COLORS[0]);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your display name.");
    const identity = createIdentity(projectId, name);
    identity.color = color;
    saveIdentity(projectId, identity);
    onDone(identity);
  }

  return (
    <Modal
      open
      onClose={() => {}}
      title="Who are you?"
      description="Choose a name so your teammates can see who added entries and budget."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="identity-name">Your name</Label>
          <Input
            id="identity-name"
            placeholder="e.g. Sarah"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div>
          <Label>Pick a colour</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {MEMBER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Pick colour ${c}`}
                onClick={() => setColor(c)}
                className="size-8 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline: color === c ? `3px solid ${c}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-line bg-stone-50 p-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {name ? name[0].toUpperCase() : <UserCircle2 className="size-5" />}
          </span>
          <span className="font-semibold text-ink">{name || "Your name"}</span>
        </div>

        <FieldError>{error}</FieldError>

        <Button type="submit" className="w-full" size="lg">
          Continue
        </Button>
      </form>
    </Modal>
  );
}
