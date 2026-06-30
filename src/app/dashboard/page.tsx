"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, ArrowUpRight, KeyRound, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile } from "@/lib/users";
import { getProject } from "@/lib/projects";
import type { Project } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { BudgetBar } from "@/components/BudgetBar";
import { Card } from "@/components/ui/Card";
import { Spinner, FullPageLoader } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/EmptyState";

export default function UserDashboardPage() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && isAdmin) router.replace("/admin/dashboard");
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (!user || isAdmin) return;
    let cancelled = false;

    async function load() {
      try {
        const profile = await getUserProfile(user!.uid);
        if (cancelled || !profile) {
          setDataLoading(false);
          return;
        }
        const fetched = await Promise.all(
          profile.assignedProjectIds.map((id) => getProject(id))
        );
        if (!cancelled) {
          setProjects(fetched.filter((p): p is Project => p !== null));
          setDataLoading(false);
        }
      } catch {
        if (!cancelled) setDataLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, isAdmin]);

  if (loading || !user) return <FullPageLoader label="Checking your session…" />;

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[200px] truncate text-sm font-medium text-muted md:inline">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Your Projects
          </h1>
          <p className="mt-1 text-muted">
            Projects your admin has given you access to.
          </p>
        </div>

        <div className="mt-8">
          {dataLoading ? (
            <div className="flex justify-center py-20">
              <Spinner className="size-8" />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects assigned"
              description="Your admin hasn't assigned any projects to your account yet."
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <UserProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function UserProjectCard({ project }: { project: Project }) {
  return (
    <Card className="group flex flex-col p-5 transition-shadow hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-ink transition-colors group-hover:text-brand-700">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {project.description || "No description"}
          </p>
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
        <Link
          href={`/p/${encodeURIComponent(project.shareKey)}`}
          aria-label="Open project"
          className="grid size-8 place-items-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
        >
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </Card>
  );
}
