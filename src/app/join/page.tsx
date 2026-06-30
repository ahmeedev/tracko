"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { getProjectByKey } from "@/lib/projects";
import { normalizeShareKey } from "@/lib/keys";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Field";

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinForm />
    </Suspense>
  );
}

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Prefill from a join link (?key=TRK-XXXX-XXXX).
  useEffect(() => {
    const fromUrl = searchParams.get("key");
    if (fromUrl) setKey(normalizeShareKey(fromUrl));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeShareKey(key);
    if (!normalized) return setError("Enter the key your admin shared.");

    setError("");
    setLoading(true);
    try {
      const project = await getProjectByKey(normalized);
      if (!project) {
        setError("No project found for that key. Double-check and try again.");
        setLoading(false);
        return;
      }
      router.push(`/p/${encodeURIComponent(project.shareKey)}`);
    } catch {
      setError("Couldn't look up that key. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Join a project"
      subtitle="Enter the share key your admin gave you to start logging expenses."
      footer={
        <>
          Have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in here
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="key">Share key</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              id="key"
              placeholder="TRK-XXXX-XXXX"
              className="pl-10 font-mono uppercase tracking-wider"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoFocus
              required
            />
          </div>
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Open project
        </Button>
      </form>
    </AuthLayout>
  );
}
