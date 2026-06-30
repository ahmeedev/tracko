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

/** Builds a stable admin identity from Firebase Auth user info. */
export function adminIdentity(uid: string, email: string): UserIdentity {
  const name = email.split("@")[0] ?? "Admin";
  return { id: uid, name, color: "#6366F1" };
}

export { MEMBER_COLORS };
