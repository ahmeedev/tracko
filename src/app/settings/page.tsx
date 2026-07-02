"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, updateUserName } from "@/lib/users";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { FullPageLoader, Spinner } from "@/components/ui/Spinner";

export default function SettingsPage() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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
        if (cancelled) return;
        if (profile) {
          setName(profile.name ?? "");
          setEmail(profile.email);
        }
      } finally {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      await updateUserName(user!.uid, trimmed);
      setSaved(true);
    } catch {
      setError("Could not save your name. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-brand-700"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-muted">Update how your name appears in projects.</p>
        </div>

        <Card className="mt-8">
          <CardBody>
            {dataLoading ? (
              <div className="flex justify-center py-10">
                <Spinner className="size-6" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-center gap-3 rounded-xl border border-line bg-stone-50 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    <Settings className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Your account</p>
                    <p className="truncate text-sm text-muted">{email}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="settings-name">Display name</Label>
                  <Input
                    id="settings-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSaved(false);
                    }}
                    placeholder="Your name"
                    required
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    This is shown on expense and budget entries you add.
                  </p>
                </div>

                <FieldError>{error}</FieldError>
                {saved && (
                  <p className="text-sm font-medium text-emerald-600">Name saved.</p>
                )}

                <Button type="submit" loading={saving} disabled={!name.trim()}>
                  Save changes
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
