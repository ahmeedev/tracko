"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FolderKanban,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  deleteProject,
  getProject,
  updateProject,
} from "@/lib/projects";
import { adminIdentity } from "@/lib/identity";
import { formatDate } from "@/lib/format";
import type { Project, ProjectInput, UserIdentity } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FullPageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { ProjectWorkspace } from "@/components/projects/ProjectWorkspace";
import { ShareKeyPanel } from "@/components/projects/ShareKeyPanel";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function AdminProjectPage() {
  return (
    <AdminShell>
      <ProjectDetail />
    </AdminShell>
  );
}

function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      try {
        const next = await getProject(id);
        if (!cancelled) {
          setProject(next);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  async function reloadProject() {
    if (!id) return;
    setProject(await getProject(id));
  }

  const identity: UserIdentity | null = user
    ? adminIdentity(user.uid, user.email ?? "admin")
    : null;

  async function handleSave(input: ProjectInput) {
    if (project) {
      await updateProject(project.id, input);
      await reloadProject();
    }
  }

  async function handleDelete() {
    if (project) {
      await deleteProject(project.id);
      router.replace("/admin/dashboard");
    }
  }

  if (loading) return <FullPageLoader label="Loading project…" />;

  if (!project) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Project not found"
        description="This project may have been deleted, or the link is incorrect."
        action={
          <Link href="/admin/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="size-4" /> All projects
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1.5 max-w-2xl text-muted">{project.description}</p>
          )}
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted">
            <CalendarDays className="size-3.5" /> Created{" "}
            {formatDate(new Date(project.createdAt).toISOString().slice(0, 10))}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit
          </Button>
          <Button variant="outline" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="lg:order-1">
          {identity && (
            <ProjectWorkspace project={project} source="admin" identity={identity} />
          )}
        </div>
        <div className="space-y-6 lg:order-2">
          <ShareKeyPanel project={project} />
          <Card>
            <CardBody>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
                How sharing works
              </h2>
              <ol className="mt-3 space-y-3 text-sm text-ink-soft">
                <Step n={1}>Copy the share key or join link above.</Step>
                <Step n={2}>Send it to anyone who should log expenses.</Step>
                <Step n={3}>
                  They open it and manage entries — no account needed.
                </Step>
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>

      <ProjectForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
        project={project}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete project?"
        description={`"${project.name}" and all of its expense entries will be permanently deleted.`}
        confirmLabel="Delete project"
      />
    </>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
