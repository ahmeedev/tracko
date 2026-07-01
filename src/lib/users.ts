import { apiJson } from "./api-client";
import type { UserProfile } from "./types";

export async function createUser(email: string, password: string): Promise<string> {
  const res = await apiJson<{ uid: string }>("/api/users", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return res.uid;
}

export async function getUsers(): Promise<UserProfile[]> {
  const res = await apiJson<{ users: UserProfile[] }>("/api/users");
  return res.users;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const res = await apiJson<{ user: UserProfile | null }>(`/api/users/${uid}`);
  return res.user;
}

export async function assignProject(uid: string, projectId: string): Promise<void> {
  await apiJson(`/api/users/${uid}/projects`, {
    method: "PUT",
    body: JSON.stringify({ projectId, action: "assign" }),
  });
}

export async function unassignProject(uid: string, projectId: string): Promise<void> {
  await apiJson(`/api/users/${uid}/projects`, {
    method: "PUT",
    body: JSON.stringify({ projectId, action: "unassign" }),
  });
}

export async function deleteUser(uid: string): Promise<void> {
  await apiJson(`/api/users/${uid}`, { method: "DELETE" });
}

/** Matches AWS Cognito default password policy requirements. */
export const COGNITO_PASSWORD_HINT =
  "At least 8 characters with uppercase, lowercase, numbers, and symbols.";

export function getCognitoPasswordError(password: string): string | null {
  const issues: string[] = [];
  if (password.length < 8) issues.push("at least 8 characters");
  if (!/[a-z]/.test(password)) issues.push("a lowercase letter");
  if (!/[A-Z]/.test(password)) issues.push("an uppercase letter");
  if (!/[0-9]/.test(password)) issues.push("a number");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("a symbol");
  if (issues.length === 0) return null;
  return `Password must include ${issues.join(", ")}.`;
}
