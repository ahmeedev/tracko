import { apiFetch, apiJson } from "./api-client";
import type { BudgetEntry, BudgetEntryInput, ProjectMember, UserIdentity } from "./types";

interface AccessOptions {
  shareKey?: string;
}

export async function getBudgetEntries(
  projectId: string,
  options?: AccessOptions
): Promise<BudgetEntry[]> {
  const qs = options?.shareKey ? `?shareKey=${encodeURIComponent(options.shareKey)}` : "";
  const res = await apiFetch(`/api/budget-entries/${projectId}${qs}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { entries: BudgetEntry[] };
  return data.entries;
}

export async function getMembers(
  projectId: string,
  options?: AccessOptions
): Promise<ProjectMember[]> {
  const qs = options?.shareKey ? `?shareKey=${encodeURIComponent(options.shareKey)}` : "";
  const res = await apiFetch(`/api/members/${projectId}${qs}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { members: ProjectMember[] };
  return data.members;
}

export async function addBudgetEntry(
  projectId: string,
  identity: UserIdentity,
  source: "admin" | "user",
  input: BudgetEntryInput,
  options?: AccessOptions
): Promise<string> {
  const res = await apiJson<{ id: string }>(`/api/budget-entries/${projectId}`, {
    method: "POST",
    body: JSON.stringify({ ...input, identity, source, shareKey: options?.shareKey }),
  });
  return res.id;
}

export async function updateBudgetEntry(
  projectId: string,
  entryId: string,
  input: BudgetEntryInput,
  previousAmount: number,
  userId: string,
  options?: AccessOptions
): Promise<void> {
  await apiJson(`/api/budget-entries/${projectId}/${entryId}`, {
    method: "PUT",
    body: JSON.stringify({ ...input, previousAmount, userId, shareKey: options?.shareKey }),
  });
}

export async function deleteBudgetEntry(
  projectId: string,
  entryId: string,
  amount: number,
  userId: string,
  options?: AccessOptions
): Promise<void> {
  const qs = new URLSearchParams({ amount: String(amount), userId });
  if (options?.shareKey) qs.set("shareKey", options.shareKey);
  await apiJson(`/api/budget-entries/${projectId}/${entryId}?${qs}`, { method: "DELETE" });
}

export function computeUserBudgets(entries: BudgetEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    map.set(e.userId, (map.get(e.userId) ?? 0) + e.amount);
  }
  return map;
}
