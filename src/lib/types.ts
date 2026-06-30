export interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  currency: string;
  ownerId: string;
  /** Unique key an admin shares so users can open this project. */
  shareKey: string;
  /** Denormalized running total of all entry amounts (kept via atomic increments). */
  spent: number;
  createdAt: number;
}

/** Project data captured from a form, before it is persisted. */
export type ProjectInput = {
  name: string;
  description: string;
  budget: number;
  currency: string;
};

export interface Entry {
  id: string;
  projectId: string;
  amount: number;
  category: string;
  /** ISO date string (yyyy-mm-dd). */
  date: string;
  note: string;
  createdAt: number;
  /** Who logged the entry — admin from the dashboard or a key-holding user. */
  source: "admin" | "user";
}

export type EntryInput = {
  amount: number;
  category: string;
  date: string;
  note: string;
};

export interface UserProfile {
  uid: string;
  email: string;
  role: "admin" | "user";
  assignedProjectIds: string[];
  createdAt: number;
}
