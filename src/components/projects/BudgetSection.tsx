"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import {
  getBudgetEntries,
  addBudgetEntry,
  updateBudgetEntry,
  deleteBudgetEntry,
} from "@/lib/budget";
import { formatCurrency, formatDate, currencySymbol } from "@/lib/format";
import { attachmentHref } from "@/lib/storage";
import type { BudgetEntry, BudgetEntryInput, Project, ProjectMember, UserIdentity } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UserAvatar } from "./MemberAvatars";
import { BudgetEntryForm } from "./BudgetEntryForm";

interface BudgetSectionProps {
  project: Project;
  identity: UserIdentity;
  source: "admin" | "user";
  onMutated?: () => void;
}

export function BudgetSection({ project, identity, source, onMutated }: BudgetSectionProps) {
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetEntry | null>(null);
  const [deleting, setDeleting] = useState<BudgetEntry | null>(null);

  const symbol = currencySymbol(project.currency);

  const accessOpts = source === "user" ? { shareKey: project.shareKey } : undefined;
  const canEditAll = source === "admin";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await getBudgetEntries(project.id, accessOpts);
        if (!cancelled) {
          setBudgetEntries(next);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, source]);

  async function reloadBudgetEntries() {
    const next = await getBudgetEntries(project.id, accessOpts);
    setBudgetEntries(next);
  }

  const memberMap = useMemo(() => {
    const m = new Map<string, ProjectMember>();
    for (const entry of budgetEntries) {
      if (!m.has(entry.userId)) {
        m.set(entry.userId, {
          userId: entry.userId,
          name: entry.userName,
          color: entry.userColor,
          source: "user",
          joinedAt: entry.createdAt,
        });
      }
    }
    return m;
  }, [budgetEntries]);

  async function handleSave(input: BudgetEntryInput) {
    if (editing) {
      await updateBudgetEntry(project.id, editing.id, input, editing.amount, identity.id, accessOpts);
    } else {
      await addBudgetEntry(project.id, identity, source, input, accessOpts);
    }
    await reloadBudgetEntries();
    onMutated?.();
  }

  async function handleDelete() {
    if (deleting) {
      await deleteBudgetEntry(project.id, deleting.id, deleting.amount, identity.id, accessOpts);
      await reloadBudgetEntries();
      onMutated?.();
    }
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  const myEntries = budgetEntries.filter((e) => e.userId === identity.id);
  const othersEntries = budgetEntries.filter((e) => e.userId !== identity.id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Budget entries</h2>
          <p className="text-sm text-muted">Your personal budget allocations</p>
        </div>
        <Button onClick={openAdd} variant="outline">
          <Plus className="size-4" /> Add budget
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner className="size-6" />
        </div>
      ) : budgetEntries.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Wallet className="size-6" />
            </span>
            <div>
              <p className="font-semibold text-ink">No budget entries yet</p>
              <p className="mt-1 text-sm text-muted">
                Add your personal budget to track how much you&apos;ve allocated.
              </p>
            </div>
            <Button onClick={openAdd} size="sm">
              <Plus className="size-4" /> Add budget
            </Button>
          </CardBody>
        </Card>
      ) : (
        <>
          {myEntries.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                Your entries
              </p>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-line">
                  {myEntries.map((entry) => (
                    <BudgetEntryRow
                      key={entry.id}
                      entry={entry}
                      currency={project.currency}
                      onEdit={() => { setEditing(entry); setFormOpen(true); }}
                      onDelete={() => setDeleting(entry)}
                      showActions
                    />
                  ))}
                </ul>
              </Card>
            </div>
          )}
          {othersEntries.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                Others&apos; entries
              </p>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-line">
                  {othersEntries.map((entry) => (
                    <BudgetEntryRow
                      key={entry.id}
                      entry={entry}
                      currency={project.currency}
                      member={memberMap.get(entry.userId)}
                      showActions={canEditAll}
                      onEdit={canEditAll ? () => { setEditing(entry); setFormOpen(true); } : undefined}
                      onDelete={canEditAll ? () => setDeleting(entry) : undefined}
                    />
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </>
      )}

      <BudgetEntryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        projectId={project.id}
        currencySymbol={symbol}
        shareKey={accessOpts?.shareKey}
        entry={editing}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete budget entry?"
        description={
          deleting
            ? `This removes the ${formatCurrency(deleting.amount, project.currency)} budget entry. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
      />
    </div>
  );
}

function BudgetEntryRow({
  entry,
  currency,
  member,
  onEdit,
  onDelete,
  showActions,
}: {
  entry: BudgetEntry;
  currency: string;
  member?: ProjectMember;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}) {
  return (
    <li className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-brand-50/40">
      <UserAvatar name={entry.userName} color={entry.userColor} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold text-ink">
            {member?.name ?? entry.userName}
          </span>
          {entry.note && (
            <span className="text-sm text-muted">· {entry.note}</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-xs text-muted">{formatDate(entry.date)}</span>
          {entry.attachmentUrl && (
            <a
              href={attachmentHref(entry.attachmentUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              <FileText className="size-3" /> {entry.attachmentName ?? "Attachment"}
            </a>
          )}
        </div>
      </div>
      <span className="shrink-0 text-base font-bold text-emerald-600">
        +{formatCurrency(entry.amount, currency)}
      </span>
      {showActions && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Edit budget entry"
            onClick={onEdit}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Delete budget entry"
            onClick={onDelete}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}
    </li>
  );
}
