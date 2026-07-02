"use client";

import { useEffect, useState } from "react";
import { UserCircle2 } from "lucide-react";
import { MEMBER_COLORS, isValidHexColor, normalizeHexColor } from "@/lib/identity";
import { UserAvatar } from "@/components/projects/MemberAvatars";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Field";

interface UserColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  previewName: string;
  disabled?: boolean;
}

export function UserColorPicker({
  value,
  onChange,
  previewName,
  disabled,
}: UserColorPickerProps) {
  const [customHex, setCustomHex] = useState(value);
  const [customError, setCustomError] = useState("");

  useEffect(() => {
    setCustomHex(value);
  }, [value]);

  function applyCustom() {
    const trimmed = customHex.trim();
    if (!isValidHexColor(trimmed)) {
      setCustomError("Enter a valid hex colour (e.g. #3B82F6).");
      return;
    }
    setCustomError("");
    onChange(normalizeHexColor(trimmed));
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Colour</Label>
        <div className="mt-2 flex flex-wrap gap-3">
          {MEMBER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={disabled}
              aria-label={`Pick colour ${c}`}
              aria-pressed={value.toUpperCase() === c.toUpperCase()}
              onClick={() => onChange(c)}
              className="size-8 rounded-full transition-transform hover:scale-110 disabled:opacity-50"
              style={{
                backgroundColor: c,
                outline: value.toUpperCase() === c.toUpperCase() ? `3px solid ${c}` : "none",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="custom-color">Custom colour</Label>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="custom-color"
            type="color"
            value={isValidHexColor(value) ? normalizeHexColor(value) : MEMBER_COLORS[0]}
            disabled={disabled}
            onChange={(e) => {
              setCustomHex(e.target.value.toUpperCase());
              setCustomError("");
              onChange(normalizeHexColor(e.target.value));
            }}
            className="size-10 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-0.5 disabled:opacity-50"
          />
          <Input
            value={customHex}
            onChange={(e) => {
              setCustomHex(e.target.value);
              setCustomError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyCustom();
              }
            }}
            placeholder="#3B82F6"
            disabled={disabled}
            className="font-mono uppercase"
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={applyCustom}
          >
            Apply
          </Button>
        </div>
        <FieldError>{customError}</FieldError>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-line bg-stone-50 p-3">
        {previewName ? (
          <UserAvatar name={previewName} color={value} size="md" />
        ) : (
          <span
            className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: value }}
          >
            <UserCircle2 className="size-4" />
          </span>
        )}
        <span className="font-semibold text-ink">{previewName || "Preview"}</span>
      </div>
    </div>
  );
}
