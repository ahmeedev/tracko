"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, LogOut, SearchX } from "lucide-react";
import { subscribeProjectByKey } from "@/lib/projects";
import { normalizeShareKey } from "@/lib/keys";
import { getStoredIdentity } from "@/lib/identity";
import type { Project, UserIdentity } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { FullPageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { CopyButton } from "@/components/CopyButton";
import { ProjectWorkspace } from "@/components/projects/ProjectWorkspace";
import { IdentitySetup } from "@/components/projects/IdentitySetup";

export default function SharedProjectPage() {
  const params = useParams<{ key: string }>();
  const key = normalizeShareKey(decodeURIComponent(params.key ?? ""));

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<UserIdentity | null>(null);

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    const unsub = subscribeProjectByKey(
      key,
      (next) => {
        setProject(next);
        setLoading(false);
        if (next) {
          const stored = getStoredIdentity(next.id);
          setIdentity(stored);
        }
      },
      () => setLoading(false)
    );
    return unsub;
  }, [key]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-stone-600 sm:inline">
              Team view
            </span>
          </div>
          <Link href="/join">
            <Button variant="outline" size="sm">
              <LogOut className="size-4" /> Leave
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {loading ? (
          <FullPageLoader label="Opening project…" />
        ) : !project ? (
          <EmptyState
            icon={SearchX}
            title="Project not found"
            description="This key doesn't match any project. It may have been changed or the project was removed."
            action={
              <Link href="/join">
                <Button>Try another key</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="mt-1.5 max-w-2xl text-muted">
                    {project.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5">
                <KeyRound className="size-4 text-brand-600" />
                <code className="font-mono text-sm font-bold text-brand-700">
                  {project.shareKey}
                </code>
                <CopyButton value={project.shareKey} label="Copy" className="border-brand-200" />
              </div>
            </div>

            <div className="mt-7">
              {identity ? (
                <ProjectWorkspace
                  project={project}
                  source="user"
                  identity={identity}
                />
              ) : (
                <IdentitySetup
                  projectId={project.id}
                  onDone={setIdentity}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
