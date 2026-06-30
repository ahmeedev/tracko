"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authErrorMessage } from "@/lib/authErrors";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Field";

export default function LoginPage() {
  const { user, loading, isAdmin, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in → redirect to the right place.
  useEffect(() => {
    if (!loading && user) {
      router.replace(isAdmin ? "/admin/dashboard" : "/dashboard");
    }
  }, [loading, user, isAdmin, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const signedInUser = await signIn(email, password);
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
      router.replace(signedInUser.email === adminEmail ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in to Tracko"
      subtitle="Enter your credentials to access your account."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
