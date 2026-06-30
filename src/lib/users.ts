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

export function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}
