import { apiFetch, apiJson } from "./api-client";
import type { Entry, EntryInput, UserIdentity } from "./types";

interface AccessOptions {
  shareKey?: string;
}

/** Polls entries for a project every 3 s. Pass shareKey for unauthenticated (public) access. */
export function subscribeEntries(
  projectId: string,
  onChange: (entries: Entry[]) => void,
  onError?: (error: Error) => void,
  options?: AccessOptions
): () => void {
  let active = true;
  const qs = options?.shareKey ? `?shareKey=${encodeURIComponent(options.shareKey)}` : "";

  async function poll() {
    try {
      const res = await apiFetch(`/api/entries/${projectId}${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { entries: Entry[] };
      if (active) onChange(data.entries);
    } catch (err) {
      if (active) onError?.(err as Error);
    }
  }

  poll();
  const timer = setInterval(poll, 3000);
  return () => { active = false; clearInterval(timer); };
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
  options?: AccessOptions
): Promise<void> {
  const qs = options?.shareKey ? `?shareKey=${encodeURIComponent(options.shareKey)}` : "";
  await apiJson(`/api/entries/${projectId}/${entryId}${qs}`, {
    method: "PUT",
    body: JSON.stringify({ ...input, previousAmount }),
  });
}

export async function deleteEntry(
  projectId: string,
  entryId: string,
  amount: number,
  options?: AccessOptions
): Promise<void> {
  const qs = new URLSearchParams({ amount: String(amount) });
  if (options?.shareKey) qs.set("shareKey", options.shareKey);
  await apiJson(`/api/entries/${projectId}/${entryId}?${qs}`, { method: "DELETE" });
}
