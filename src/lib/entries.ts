import {
  collection,
  doc,
  increment,
  onSnapshot,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Entry, EntryInput } from "./types";

function entriesCol(projectId: string) {
  return collection(db, "projects", projectId, "entries");
}

function mapEntry(
  projectId: string,
  snap: QueryDocumentSnapshot<DocumentData>
): Entry {
  const data = snap.data();
  return {
    id: snap.id,
    projectId,
    amount: typeof data.amount === "number" ? data.amount : 0,
    category: data.category ?? "",
    date: data.date ?? "",
    note: data.note ?? "",
    createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
    source: data.source === "admin" ? "admin" : "user",
  };
}

/** Realtime subscription to a project's entries, newest first. */
export function subscribeEntries(
  projectId: string,
  onChange: (entries: Entry[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    entriesCol(projectId),
    (snap) => {
      const entries = snap.docs
        .map((d) => mapEntry(projectId, d))
        .sort((a, b) => {
          // Sort by expense date, then by creation time as a tiebreaker.
          if (a.date !== b.date) return a.date < b.date ? 1 : -1;
          return b.createdAt - a.createdAt;
        });
      onChange(entries);
    },
    (err) => onError?.(err)
  );
}

/**
 * Adds an entry and atomically bumps the project's denormalized `spent` total.
 * Both writes happen in one batch so the dashboard stays consistent.
 */
export async function addEntry(
  projectId: string,
  input: EntryInput,
  source: Entry["source"]
): Promise<string> {
  const entryRef = doc(entriesCol(projectId));
  const batch = writeBatch(db);
  batch.set(entryRef, { ...input, source, createdAt: Date.now() });
  batch.update(doc(db, "projects", projectId), {
    spent: increment(input.amount),
  });
  await batch.commit();
  return entryRef.id;
}

/**
 * Updates an entry and adjusts the project's `spent` total by the delta
 * between the new and previous amount.
 */
export async function updateEntry(
  projectId: string,
  entryId: string,
  input: EntryInput,
  previousAmount: number
): Promise<void> {
  const delta = input.amount - previousAmount;
  const batch = writeBatch(db);
  batch.update(doc(db, "projects", projectId, "entries", entryId), { ...input });
  if (delta !== 0) {
    batch.update(doc(db, "projects", projectId), { spent: increment(delta) });
  }
  await batch.commit();
}

/** Deletes an entry and removes its amount from the project's `spent` total. */
export async function deleteEntry(
  projectId: string,
  entryId: string,
  amount: number
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "projects", projectId, "entries", entryId));
  batch.update(doc(db, "projects", projectId), { spent: increment(-amount) });
  await batch.commit();
}
