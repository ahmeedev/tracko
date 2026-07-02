import { apiFetch, apiJson } from "./api-client";
import type { Entry, EntryInput, UserIdentity } from "./types";

interface AccessOptions {
  shareKey?: string;
}

/** Pass shareKey for unauthenticated (public) access. */
export async function getEntries(
  projectId: string,
  options?: AccessOptions
): Promise<Entry[]> {
  const qs = options?.shareKey ? `?shareKey=${encodeURIComponent(options.shareKey)}` : "";
  const res = await apiFetch(`/api/entries/${projectId}${qs}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { entries: Entry[] };
  return data.entries;
}

export async function addEntry(
  projectId: string,
  input: EntryInput,
  source: Entry["source"],
  identity?: UserIdentity,
  options?: AccessOptions
): Promise<string> {
  const res = await apiJson<{ id: string }>(`/api/entries/${projectId}`, {
    method: "POST",
    body: JSON.stringify({ ...input, source, identity, shareKey: options?.shareKey }),
  });
  return res.id;
}

export async function updateEntry(
  projectId: string,
  entryId: string,
  input: EntryInput,
  previousAmount: number,
  userId: string,
  options?: AccessOptions
): Promise<void> {
  const qs = options?.shareKey ? `?shareKey=${encodeURIComponent(options.shareKey)}` : "";
  await apiJson(`/api/entries/${projectId}/${entryId}${qs}`, {
    method: "PUT",
    body: JSON.stringify({ ...input, previousAmount, userId, shareKey: options?.shareKey }),
  });
}

export async function deleteEntry(
  projectId: string,
  entryId: string,
  amount: number,
  userId: string,
  options?: AccessOptions
): Promise<void> {
  const qs = new URLSearchParams({ amount: String(amount), userId });
  if (options?.shareKey) qs.set("shareKey", options.shareKey);
  await apiJson(`/api/entries/${projectId}/${entryId}?${qs}`, { method: "DELETE" });
}
