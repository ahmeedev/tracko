"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getBudgetEntries,
  getMembers,
  computeUserBudgets,
} from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import type { BudgetEntry, Project, ProjectMember, UserIdentity } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { UserAvatar } from "./MemberAvatars";

export function MemberBudgetsCard({
  project,
  identity,
  source,
  refreshKey = 0,
}: {
  project: Project;
  identity: UserIdentity;
  source: "admin" | "user";
  refreshKey?: number;
}) {
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);

  const accessOpts = source === "user" ? { shareKey: project.shareKey } : undefined;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [entries, memberList] = await Promise.all([
          getBudgetEntries(project.id, accessOpts),
          getMembers(project.id, accessOpts),
        ]);
        if (!cancelled) {
          setBudgetEntries(entries);
          setMembers(memberList);
        }
      } catch {
        // keep existing data on error
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, source, refreshKey]);

  const userBudgets = useMemo(
    () => computeUserBudgets(budgetEntries),
    [budgetEntries]
  );

  if (members.length === 0) return null;

  return (
    <Card>
      <CardBody>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-muted">
          Member budgets
        </h3>
        <div className="space-y-4">
          {members.map((member) => {
            const budget = userBudgets.get(member.userId) ?? 0;
            const pct = budget > 0 ? Math.min((project.spent / budget) * 100, 100) : 0;
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
                  <p className="text-sm font-bold text-ink">
                    {formatCurrency(budget, project.currency)}
                  </p>
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
  );
}
