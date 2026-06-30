"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, LogOut, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { FullPageLoader } from "@/components/ui/Spinner";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!isAdmin) router.replace("/dashboard");
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return <FullPageLoader label="Checking your session…" />;
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href="/admin/dashboard" />
            <span className="hidden rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-700 sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin/dashboard"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
            >
              <LayoutDashboard className="size-4" /> Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
            >
              <Users className="size-4" /> Users
            </Link>
            <span className="hidden max-w-45 truncate text-sm font-medium text-muted md:inline">
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
        {children}
      </main>
    </div>
  );
}
