"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderKanban, Plus, Wallet, Receipt } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  createProject,
  deleteProject,
  subscribeProjects,
  updateProject,
} from "@/lib/projects";
import { formatCurrency } from "@/lib/format";
import type { Project, ProjectInput } from "@/lib/types";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function DashboardPage() {
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeProjects(
      user.uid,
      (next) => {
        setProjects(next);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user]);

  const totals = useMemo(() => {
    const budget = projects.reduce((s, p) => s + p.budget, 0);
    const spent = projects.reduce((s, p) => s + p.spent, 0);
    // Primary currency = the one used by the most projects (display only).
    const counts = new Map<string, number>();
    projects.forEach((p) => counts.set(p.currency, (counts.get(p.currency) ?? 0) + 1));
    const currency =
      [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";
    return { budget, spent, currency, mixed: counts.size > 1 };
  }, [projects]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setFormOpen(true);
  }

  async function handleSave(input: ProjectInput) {
    if (editing) {
      await updateProject(editing.id, input);
    } else if (user) {
      await createProject(user.uid, input);
    }
  }

  async function handleDelete() {
    if (deleting) await deleteProject(deleting.id);
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Your projects
          </h1>
          <p className="mt-1 text-muted">
            Create projects, set budgets and share keys with your team.
          </p>
        </div>
        <Button size="lg" onClick={openCreate}>
          <Plus className="size-4" /> New project
        </Button>
      </div>

      {/* Summary */}
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <SummaryStat
          icon={<FolderKanban className="size-5" />}
          label="Projects"
          value={String(projects.length)}
        />
        <SummaryStat
          icon={<Wallet className="size-5" />}
          label={totals.mixed ? "Total budget (mixed)" : "Total budget"}
          value={formatCurrency(totals.budget, totals.currency)}
        />
        <SummaryStat
          icon={<Receipt className="size-5" />}
          label={totals.mixed ? "Total spent (mixed)" : "Total spent"}
          value={formatCurrency(totals.spent, totals.currency)}
          accent
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-8" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to set a budget and generate a share key for your team."
            action={
              <Button onClick={openCreate}>
                <Plus className="size-4" /> New project
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        project={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete project?"
        description={
          deleting
            ? `"${deleting.name}" and all of its expense entries will be permanently deleted.`
            : ""
        }
        confirmLabel="Delete project"
      />
    </>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
            accent ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-0.5 truncate text-xl font-extrabold text-ink">
            {value}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
