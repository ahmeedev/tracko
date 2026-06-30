export interface Project {
  id: string;
  name: string;
  description: string;
  /** Denormalized running total of all budget entry amounts (kept via atomic increments). */
  budget: number;
  currency: string;
  ownerId: string;
  /** Unique key an admin shares so users can open this project. */
  shareKey: string;
  /** Denormalized running total of all entry amounts (kept via atomic increments). */
  spent: number;
  createdAt: number;
}

/** Project data captured from a form, before it is persisted. Budget is added later via BudgetEntry records. */
export type ProjectInput = {
  name: string;
  description: string;
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
  /** Identity of the person who created this entry. */
  userId?: string;
  userName?: string;
  userColor?: string;
  /** Optional file attachment stored in S3 (value is the S3 object key). */
  attachmentUrl?: string;
  attachmentName?: string;
}

export type EntryInput = {
  amount: number;
  category: string;
  date: string;
  note: string;
  attachmentUrl?: string;
  attachmentName?: string;
};

export interface UserProfile {
  uid: string;
  email: string;
  role: "admin" | "user";
  assignedProjectIds: string[];
  createdAt: number;
}

/** Stable identity for whoever is viewing a project (admin or public key-holder). */
export interface UserIdentity {
  id: string;
  name: string;
  color: string;
}

/** A single budget contribution entry for one member. */
export interface BudgetEntry {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userColor: string;
  amount: number;
  note: string;
  date: string;
  /** Optional file attachment stored in S3 (value is the S3 object key). */
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: number;
}

export type BudgetEntryInput = {
  amount: number;
  note: string;
  date: string;
  attachmentUrl?: string;
  attachmentName?: string;
};

/** Denormalized member record for fast avatar lookups. */
export interface ProjectMember {
  userId: string;
  name: string;
  color: string;
  source: "admin" | "user";
  joinedAt: number;
}
