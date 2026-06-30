import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  getAuth,
} from "firebase/auth";
import { deleteApp, getApps, initializeApp } from "firebase/app";
import { db } from "./firebase";
import type { UserProfile } from "./types";

const usersCol = collection(db, "users");

function secondaryFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

/**
 * Creates a Firebase Auth user without signing out the current admin session
 * by using a secondary app instance that is immediately discarded.
 */
export async function createUser(
  email: string,
  password: string
): Promise<string> {
  const appName = `secondary-${Date.now()}`;
  const secondaryApp = initializeApp(secondaryFirebaseConfig(), appName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const { user } = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password
    );
    await setDoc(doc(db, "users", user.uid), {
      email,
      role: "user",
      assignedProjectIds: [],
      createdAt: Date.now(),
    });
    return user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}

function mapUser(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    email: typeof data.email === "string" ? data.email : "",
    role: data.role === "admin" ? "admin" : "user",
    assignedProjectIds: Array.isArray(data.assignedProjectIds)
      ? (data.assignedProjectIds as string[])
      : [],
    createdAt: typeof data.createdAt === "number" ? data.createdAt : 0,
  };
}

export async function getUsers(): Promise<UserProfile[]> {
  const q = query(usersCol, where("role", "==", "user"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapUser(d.id, d.data() as Record<string, unknown>));
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return mapUser(snap.id, snap.data() as Record<string, unknown>);
}

export async function assignProject(
  uid: string,
  projectId: string
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    assignedProjectIds: arrayUnion(projectId),
  });
}

export async function unassignProject(
  uid: string,
  projectId: string
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    assignedProjectIds: arrayRemove(projectId),
  });
}

export async function deleteUser(uid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, "users", uid));
  await batch.commit();
}

export function generatePassword(): string {
  const chars =
    "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}
