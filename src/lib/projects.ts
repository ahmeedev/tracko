import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { generateShareKey } from "./keys";
import type { Project, ProjectInput } from "./types";

const projectsCol = collection(db, "projects");

function mapProject(
  snap: QueryDocumentSnapshot<DocumentData>
): Project {
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name ?? "",
    description: data.description ?? "",
    budget: typeof data.budget === "number" ? data.budget : 0,
    currency: data.currency ?? "USD",
    ownerId: data.ownerId ?? "",
    shareKey: data.shareKey ?? "",
    spent: typeof data.spent === "number" ? data.spent : 0,
    createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
  };
}

/** Creates a project owned by `ownerId` and assigns it a fresh share key. */
export async function createProject(
  ownerId: string,
  input: ProjectInput
): Promise<string> {
  const ref = await addDoc(projectsCol, {
    ...input,
    ownerId,
    shareKey: generateShareKey(),
    spent: 0,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateProject(
  id: string,
  input: ProjectInput
): Promise<void> {
  await updateDoc(doc(db, "projects", id), { ...input });
}

export async function regenerateShareKey(id: string): Promise<string> {
  const shareKey = generateShareKey();
  await updateDoc(doc(db, "projects", id), { shareKey });
  return shareKey;
}

/** Deletes a project and all of its entries in a single batch. */
export async function deleteProject(id: string): Promise<void> {
  const entriesSnap = await getDocs(collection(db, "projects", id, "entries"));
  const batch = writeBatch(db);
  entriesSnap.forEach((entry) => batch.delete(entry.ref));
  batch.delete(doc(db, "projects", id));
  await batch.commit();
}

/** Realtime subscription to every project owned by `ownerId` (newest first). */
export function subscribeProjects(
  ownerId: string,
  onChange: (projects: Project[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(projectsCol, where("ownerId", "==", ownerId));
  return onSnapshot(
    q,
    (snap) => {
      const projects = snap.docs
        .map(mapProject)
        .sort((a, b) => b.createdAt - a.createdAt);
      onChange(projects);
    },
    (err) => onError?.(err)
  );
}

export async function getProject(id: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, "projects", id));
  return snap.exists()
    ? mapProject(snap as QueryDocumentSnapshot<DocumentData>)
    : null;
}

/** Realtime subscription to a single project by id. */
export function subscribeProject(
  id: string,
  onChange: (project: Project | null) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    doc(db, "projects", id),
    (snap) =>
      onChange(
        snap.exists()
          ? mapProject(snap as QueryDocumentSnapshot<DocumentData>)
          : null
      ),
    (err) => onError?.(err)
  );
}

/** Realtime subscription to a single project, looked up by its share key. */
export function subscribeProjectByKey(
  shareKey: string,
  onChange: (project: Project | null) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(projectsCol, where("shareKey", "==", shareKey), limit(1));
  return onSnapshot(
    q,
    (snap) => onChange(snap.empty ? null : mapProject(snap.docs[0])),
    (err) => onError?.(err)
  );
}

export async function getProjectByKey(
  shareKey: string
): Promise<Project | null> {
  const q = query(projectsCol, where("shareKey", "==", shareKey), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : mapProject(snap.docs[0]);
}
