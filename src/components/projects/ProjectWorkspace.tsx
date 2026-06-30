"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { subscribeEntries, addEntry, updateEntry, deleteEntry } from "@/lib/entries";
import { currencySymbol, formatCurrency, formatDate } from "@/lib/format";
import type { Entry, EntryInput, Project, UserIdentity } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { BudgetBar } from "@/components/BudgetBar";
import { EntryForm } from "@/components/entries/EntryForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UserAvatar } from "./MemberAvatars";
import { BudgetSection } from "./BudgetSection";

const CATEGORY_COLORS = [
  "bg-brand-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
];

export function ProjectWorkspace({
  project,
  source,
  identity,
}: {
  project: Project;
  source: Entry["source"];
  identity: UserIdentity;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState<Entry | null>(null);

  const symbol = currencySymbol(project.currency);

  useEffect(() => {
    const unsub = subscribeEntries(
      project.id,
      (next) => {
        setEntries(next);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [project.id]);

  const spent = useMemo(
    () => entries.reduce((sum, e) => sum + e.amount, 0),
    [entries]
  );

  const remaining = project.budget - spent;

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return [...map.entries()]
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [entries]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(entry: Entry) {
    setEditing(entry);
    setFormOpen(true);
  }

  async function handleSave(input: EntryInput) {
    if (editing) {
      await updateEntry(project.id, editing.id, input, editing.amount);
    } else {
      await addEntry(project.id, input, source, identity);
    }
  }

  async function handleDelete() {
    if (deleting) await deleteEntry(project.id, deleting.id, deleting.amount);
  }

  return (
    <div className="space-y-8">
      {/* Budget summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Wallet className="size-5" />}
          label="Budget"
          value={formatCurrency(project.budget, project.currency)}
        />
        <StatCard
          icon={<Receipt className="size-5" />}
          label="Spent"
          value={formatCurrency(spent, project.currency)}
          accent
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="Remaining"
          value={formatCurrency(remaining, project.currency)}
          tone={remaining < 0 ? "danger" : "default"}
        />
      </div>

      <Card>
        <CardBody>
          <BudgetBar
            spent={spent}
            budget={project.budget}
            currency={project.currency}
          />
          {categories.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
                By category
              </p>
              <div className="space-y-2.5">
                {categories.map((cat, i) => {
                  const pct = spent > 0 ? (cat.total / spent) * 100 : 0;
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span
                        className={`size-2.5 shrink-0 rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                      />
                      <span className="w-28 shrink-0 truncate text-sm font-semibold text-ink">
                        {cat.name}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className={`h-full rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right text-sm font-bold text-ink">
                        {formatCurrency(cat.total, project.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Per-user budgets */}
      <BudgetSection project={project} identity={identity} source={source} />

      {/* Expenses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Expenses</h2>
            <p className="text-sm text-muted">
              {entries.length} {entries.length === 1 ? "entry" : "entries"} logged
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="size-4" /> Add expense
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-7" />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Add the first expense to start tracking this project's spend against its budget."
            action={
              <Button onClick={openAdd}>
                <Plus className="size-4" /> Add expense
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-brand-50/40"
                >
                  {entry.userName && entry.userColor && (
                    <UserAvatar name={entry.userName} color={entry.userColor} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{entry.category}</span>
                      {entry.source === "admin" ? (
                        <Badge tone="brand">Admin</Badge>
                      ) : (
                        <Badge tone="neutral">Team</Badge>
                      )}
                      {entry.userName && (
                        <span className="text-xs text-muted">{entry.userName}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm text-muted">
                        {entry.note || "No note"} · {formatDate(entry.date)}
                      </span>
                      {entry.attachmentUrl && (
                        <a
                          href={entry.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                        >
                          <FileText className="size-3" />{" "}
                          {entry.attachmentName ?? "Attachment"}
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-base font-bold text-ink">
                    {formatCurrency(entry.amount, project.currency)}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <IconButton
                      label="Edit entry"
                      onClick={() => openEdit(entry)}
                    >
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton
                      label="Delete entry"
                      danger
                      onClick={() => setDeleting(entry)}
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <EntryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        currencySymbol={symbol}
        projectId={project.id}
        entry={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete expense?"
        description={
          deleting
            ? `This removes the ${formatCurrency(deleting.amount, project.currency)} ${deleting.category} entry. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  tone?: "default" | "danger";
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
          <p
            className={`mt-0.5 truncate text-xl font-extrabold ${
              tone === "danger" ? "text-red-600" : "text-ink"
            }`}
          >
            {value}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

function IconButton({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-2 text-muted transition-colors ${
        danger
          ? "hover:bg-red-50 hover:text-red-600"
          : "hover:bg-brand-50 hover:text-brand-700"
      }`}
    >
      {children}
    </button>
  );
}
