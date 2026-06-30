"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import {
  subscribeBudgetEntries,
  subscribeMembers,
  addBudgetEntry,
  updateBudgetEntry,
  deleteBudgetEntry,
  computeUserBudgets,
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
}

export function BudgetSection({ project, identity, source }: BudgetSectionProps) {
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetEntry | null>(null);
  const [deleting, setDeleting] = useState<BudgetEntry | null>(null);

  const symbol = currencySymbol(project.currency);

  const accessOpts = source === "user" ? { shareKey: project.shareKey } : undefined;

  useEffect(() => {
    const unsubEntries = subscribeBudgetEntries(
      project.id,
      (next) => { setBudgetEntries(next); setLoading(false); },
      () => setLoading(false),
      accessOpts
    );
    const unsubMembers = subscribeMembers(project.id, setMembers, undefined, accessOpts);
    return () => { unsubEntries(); unsubMembers(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, source]);

  const userBudgets = useMemo(
    () => computeUserBudgets(budgetEntries),
    [budgetEntries]
  );

  const memberMap = useMemo(() => {
    const m = new Map<string, ProjectMember>();
    members.forEach((mem) => m.set(mem.userId, mem));
    return m;
  }, [members]);

  async function handleSave(input: BudgetEntryInput) {
    if (editing) {
      await updateBudgetEntry(project.id, editing.id, input, editing.amount, accessOpts);
    } else {
      await addBudgetEntry(project.id, identity, source, input, accessOpts);
    }
  }

  async function handleDelete() {
    if (deleting) await deleteBudgetEntry(project.id, deleting.id, deleting.amount, accessOpts);
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  const myEntries = budgetEntries.filter((e) => e.userId === identity.id);
  const othersEntries = budgetEntries.filter((e) => e.userId !== identity.id);

  return (
    <div className="space-y-4">
      {/* Per-member budget summary */}
      {members.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-muted">
              Member budgets
            </h3>
            <div className="space-y-4">
              {members.map((member) => {
                const budget = userBudgets.get(member.userId) ?? 0;
                const pct = budget > 0 ? Math.min((project.spent / budget) * 100, 100) : 0;
                const remaining = budget - project.spent;
                return (
                  <div key={member.userId}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={member.name} color={member.color} />
                        <span className="text-sm font-semibold text-ink">
                          {member.name}
                          {member.userId === identity.id && (
                            <span className="ml-1.5 text-xs text-muted">(you)</span>
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-ink">
                          {formatCurrency(budget, project.currency)}
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            remaining < 0 ? "text-red-600" : "text-muted"
                          }`}
                        >
                          {remaining < 0 ? "−" : ""}{formatCurrency(Math.abs(remaining), project.currency)} left
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 100 ? "bg-red-500" : "bg-brand-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

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
