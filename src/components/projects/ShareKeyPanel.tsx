"use client";

import { useState } from "react";
import { KeyRound, Link2, RefreshCw } from "lucide-react";
import { regenerateShareKey } from "@/lib/projects";
import type { Project } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { CopyButton } from "@/components/CopyButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function ShareKeyPanel({ project }: { project: Project }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Built on the client so it reflects whatever host the admin is on.
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?key=${project.shareKey}`
      : `/join?key=${project.shareKey}`;

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 text-brand-700">
          <KeyRound className="size-4" />
          <h2 className="text-sm font-bold uppercase tracking-wide">Share key</h2>
        </div>
        <p className="mt-1.5 text-sm text-muted">
          Anyone with this key can open the project and manage its expenses.
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-brand-50 px-4 py-3 text-center">
          <code className="font-mono text-lg font-extrabold tracking-wider text-brand-700">
            {project.shareKey}
          </code>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CopyButton value={project.shareKey} label="Copy key" />
          <CopyButton value={joinUrl} label="Copy join link" />
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
          >
            <RefreshCw className="size-3.5" /> Regenerate
          </button>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <Link2 className="size-3.5" /> Tip: the join link drops your team
          straight into this project.
        </p>
      </CardBody>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await regenerateShareKey(project.id);
        }}
        title="Regenerate share key?"
        description="The current key will stop working immediately. Anyone using it will need the new key to keep access."
        confirmLabel="Regenerate key"
      />
    </Card>
  );
}
