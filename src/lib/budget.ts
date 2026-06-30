import { apiFetch, apiJson } from "./api-client";
import type { BudgetEntry, BudgetEntryInput, ProjectMember, UserIdentity } from "./types";

interface AccessOptions {
  shareKey?: string;
}

export function subscribeBudgetEntries(
  projectId: string,
  onChange: (entries: BudgetEntry[]) => void,
  onError?: (error: Error) => void,
  options?: AccessOptions
): () => void {
  let active = true;
  const qs = options?.shareKey ? `?shareKey=${encodeURIComponent(options.shareKey)}` : "";

  async function poll() {
    try {
      const res = await apiFetch(`/api/budget-entries/${projectId}${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { entries: BudgetEntry[] };
      if (active) onChange(data.entries);
    } catch (err) {
      if (active) onError?.(err as Error);
    }
  }

  poll();
  const timer = setInterval(poll, 3000);
  return () => { active = false; clearInterval(timer); };
}

export function subscribeMembers(
  projectId: string,
  onChange: (members: ProjectMember[]) => void,
  onError?: (error: Error) => void,
  options?: AccessOptions
): () => void {
  let active = true;
  const qs = options?.shareKey ? `?shareKey=${encodeURIComponent(options.shareKey)}` : "";

  async function poll() {
    try {
      const res = await apiFetch(`/api/members/${projectId}${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { members: ProjectMember[] };
      if (active) onChange(data.members);
    } catch (err) {
      if (active) onError?.(err as Error);
    }
  }

  poll();
  const timer = setInterval(poll, 3000);
  return () => { active = false; clearInterval(timer); };
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
  options?: AccessOptions
): Promise<void> {
  await apiJson(`/api/budget-entries/${projectId}/${entryId}`, {
    method: "PUT",
    body: JSON.stringify({ ...input, previousAmount, shareKey: options?.shareKey }),
  });
}

export async function deleteBudgetEntry(
  projectId: string,
  entryId: string,
  amount: number,
  options?: AccessOptions
): Promise<void> {
  const qs = new URLSearchParams({ amount: String(amount) });
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
