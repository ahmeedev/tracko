"use client";

import Link from "next/link";
import { ArrowUpRight, KeyRound, Pencil, Trash2 } from "lucide-react";
import type { Project } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { BudgetBar } from "@/components/BudgetBar";
import { CopyButton } from "@/components/CopyButton";

export function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  return (
    <Card className="group flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/admin/projects/${project.id}`} className="min-w-0">
          <h3 className="truncate text-lg font-bold text-ink transition-colors group-hover:text-brand-700">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {project.description || "No description"}
          </p>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Edit project"
            onClick={() => onEdit(project)}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Delete project"
            onClick={() => onDelete(project)}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        <BudgetBar
          spent={project.spent}
          budget={project.budget}
          currency={project.currency}
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <KeyRound className="size-4 shrink-0 text-brand-500" />
          <code className="truncate font-mono text-sm font-semibold text-ink-soft">
            {project.shareKey}
          </code>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CopyButton value={project.shareKey} label="Key" />
          <Link
            href={`/admin/projects/${project.id}`}
            aria-label="Open project"
            className="grid size-8 place-items-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
