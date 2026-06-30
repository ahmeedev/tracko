import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { BudgetEntry, BudgetEntryInput, ProjectMember, UserIdentity } from "./types";

function budgetEntriesCol(projectId: string) {
  return collection(db, "projects", projectId, "budgetEntries");
}

function membersCol(projectId: string) {
  return collection(db, "projects", projectId, "members");
}

function mapBudgetEntry(
  projectId: string,
  snap: QueryDocumentSnapshot<DocumentData>
): BudgetEntry {
  const d = snap.data();
  return {
    id: snap.id,
    projectId,
    userId: d.userId ?? "",
    userName: d.userName ?? "",
    userColor: d.userColor ?? "#3B82F6",
    amount: typeof d.amount === "number" ? d.amount : 0,
    note: d.note ?? "",
    date: d.date ?? "",
    attachmentUrl: d.attachmentUrl ?? undefined,
    attachmentName: d.attachmentName ?? undefined,
    createdAt: typeof d.createdAt === "number" ? d.createdAt : 0,
  };
}

function mapMember(snap: QueryDocumentSnapshot<DocumentData>): ProjectMember {
  const d = snap.data();
  return {
    userId: snap.id,
    name: d.name ?? "",
    color: d.color ?? "#3B82F6",
    source: d.source === "admin" ? "admin" : "user",
    joinedAt: typeof d.joinedAt === "number" ? d.joinedAt : 0,
  };
}

/** Realtime subscription to all budget entries for a project, newest first. */
export function subscribeBudgetEntries(
  projectId: string,
  onChange: (entries: BudgetEntry[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(budgetEntriesCol(projectId), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => mapBudgetEntry(projectId, d))),
    (err) => onError?.(err)
  );
}

/** Realtime subscription to all members for a project. */
export function subscribeMembers(
  projectId: string,
  onChange: (members: ProjectMember[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    membersCol(projectId),
    (snap) =>
      onChange(
        snap.docs
          .map((d) => mapMember(d as QueryDocumentSnapshot<DocumentData>))
          .sort((a, b) => a.joinedAt - b.joinedAt)
      ),
    (err) => onError?.(err)
  );
}

/** Upserts the member record for a user (idempotent — safe to call on every entry add). */
export async function upsertMember(
  projectId: string,
  identity: UserIdentity,
  source: "admin" | "user"
): Promise<void> {
  const memberRef = doc(membersCol(projectId), identity.id);
  await setDoc(
    memberRef,
    { name: identity.name, color: identity.color, source, joinedAt: Date.now() },
    { merge: true }
  );
}

/** Adds a budget entry and upserts the member record. */
export async function addBudgetEntry(
  projectId: string,
  identity: UserIdentity,
  source: "admin" | "user",
  input: BudgetEntryInput
): Promise<string> {
  await upsertMember(projectId, identity, source);
  const ref = await addDoc(budgetEntriesCol(projectId), {
    userId: identity.id,
    userName: identity.name,
    userColor: identity.color,
    ...input,
    createdAt: Date.now(),
  });
  return ref.id;
}

/** Updates an existing budget entry. */
export async function updateBudgetEntry(
  projectId: string,
  entryId: string,
  input: BudgetEntryInput
): Promise<void> {
  await updateDoc(
    doc(db, "projects", projectId, "budgetEntries", entryId),
    { ...input }
  );
}

/** Deletes a budget entry. */
export async function deleteBudgetEntry(
  projectId: string,
  entryId: string
): Promise<void> {
  await deleteDoc(doc(db, "projects", projectId, "budgetEntries", entryId));
}

/** Returns a map of userId → total budget amount. */
export function computeUserBudgets(entries: BudgetEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    map.set(e.userId, (map.get(e.userId) ?? 0) + e.amount);
  }
  return map;
}
