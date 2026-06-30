import { apiJson, apiFetch } from "./api-client";
import type { Project, ProjectInput } from "./types";

export async function createProject(
  _ownerId: string,
  input: ProjectInput
): Promise<string> {
  const res = await apiJson<{ id: string }>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.id;
}

export async function updateProject(id: string, input: ProjectInput): Promise<void> {
  await apiJson(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function regenerateShareKey(id: string): Promise<string> {
  const res = await apiJson<{ shareKey: string }>(`/api/projects/${id}/sharekey`, {
    method: "POST",
  });
  return res.shareKey;
}

export async function deleteProject(id: string): Promise<void> {
  await apiJson(`/api/projects/${id}`, { method: "DELETE" });
}

export async function getProject(id: string): Promise<Project | null> {
  const res = await apiJson<{ project: Project | null }>(`/api/projects/${id}`);
  return res.project;
}

export async function getProjectByKey(shareKey: string): Promise<Project | null> {
  const res = await fetch(`/api/projects/key/${encodeURIComponent(shareKey)}`);
  if (!res.ok) return null;
  const data = await res.json() as { project: Project | null };
  return data.project;
}

/** Polls the server every 3 s and calls onChange with fresh project list. */
export function subscribeProjects(
  ownerId: string,
  onChange: (projects: Project[]) => void,
  onError?: (error: Error) => void
): () => void {
  let active = true;

  async function poll() {
    try {
      const res = await apiFetch(`/api/projects?ownerId=${encodeURIComponent(ownerId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { projects: Project[] };
      if (active) onChange(data.projects);
    } catch (err) {
      if (active) onError?.(err as Error);
    }
  }

  poll();
  const timer = setInterval(poll, 3000);
  return () => { active = false; clearInterval(timer); };
}

/** Polls a single project by id every 3 s. */
export function subscribeProject(
  id: string,
  onChange: (project: Project | null) => void,
  onError?: (error: Error) => void
): () => void {
  let active = true;

  async function poll() {
    try {
      const res = await apiFetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { project: Project | null };
      if (active) onChange(data.project);
    } catch (err) {
      if (active) onError?.(err as Error);
    }
  }

  poll();
  const timer = setInterval(poll, 3000);
  return () => { active = false; clearInterval(timer); };
}

/** Polls a project by share key every 3 s. No auth required. */
export function subscribeProjectByKey(
  shareKey: string,
  onChange: (project: Project | null) => void,
  onError?: (error: Error) => void
): () => void {
  let active = true;

  async function poll() {
    try {
      const res = await fetch(`/api/projects/key/${encodeURIComponent(shareKey)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { project: Project | null };
      if (active) onChange(data.project);
    } catch (err) {
      if (active) onError?.(err as Error);
    }
  }

  poll();
  const timer = setInterval(poll, 3000);
  return () => { active = false; clearInterval(timer); };
}
