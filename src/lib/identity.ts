import type { UserIdentity } from "./types";

const MEMBER_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
  "#F97316",
  "#EC4899",
];

function randomColor(): string {
  return MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)];
}

function generateId(): string {
  return crypto.randomUUID();
}

function storageKey(projectId: string): string {
  return `tracko_identity_${projectId}`;
}

/** Returns the stored identity for a project, or null if none exists. */
export function getStoredIdentity(projectId: string): UserIdentity | null {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserIdentity>;
    if (parsed.id && parsed.name && parsed.color) {
      return { id: parsed.id, name: parsed.name, color: parsed.color };
    }
    return null;
  } catch {
    return null;
  }
}

/** Saves (or overwrites) the identity for a project. */
export function saveIdentity(projectId: string, identity: UserIdentity): void {
  localStorage.setItem(storageKey(projectId), JSON.stringify(identity));
}

/** Creates and stores a new identity with a random color for a project. */
export function createIdentity(projectId: string, name: string): UserIdentity {
  const identity: UserIdentity = {
    id: generateId(),
    name: name.trim(),
    color: randomColor(),
  };
  saveIdentity(projectId, identity);
  return identity;
}

export function colorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR.test(value.trim());
}

/** Normalises shorthand hex (#RGB) to #RRGGBB. */
export function normalizeHexColor(value: string): string {
  const hex = value.trim();
  if (!HEX_COLOR.test(hex)) return hex;
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return hex.toUpperCase();
}

/** Builds a stable identity from an authenticated user's account profile. */
export function accountIdentity(uid: string, name: string, color?: string): UserIdentity {
  const resolved =
    color && isValidHexColor(color) ? normalizeHexColor(color) : colorFromId(uid);
  return { id: uid, name: name.trim(), color: resolved };
}

/** Builds a stable admin identity from the authenticated user's info. */
export function adminIdentity(uid: string, email: string, name?: string): UserIdentity {
  const displayName = name?.trim() || email.split("@")[0] || "Admin";
  return { id: uid, name: displayName, color: "#6366F1" };
}

export { MEMBER_COLORS };
