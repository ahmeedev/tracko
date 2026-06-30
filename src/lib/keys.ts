import { customAlphabet } from "nanoid";

// Unambiguous characters only (no 0/O, 1/I/L) so keys are easy to read & type.
const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const segment = customAlphabet(alphabet, 4);

/**
 * Generates a human-friendly share key, e.g. `TRK-9K4M-PQ7Z`.
 * Two 4-char segments give ~31^8 ≈ 8.5e11 combinations — plenty for sharing.
 */
export function generateShareKey(): string {
  return `TRK-${segment()}-${segment()}`;
}

/** Normalizes user input (uppercase, trims, collapses spacing) for lookups. */
export function normalizeShareKey(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}
