"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cognitoSignIn, cognitoSignOut, getCurrentSession } from "@/lib/cognito";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

export interface AppUser {
  uid: string;
  email: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentSession().then((session) => {
      if (session) {
        const payload = session.getIdToken().decodePayload();
        setUser({ uid: payload.sub as string, email: payload.email as string });
      }
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: !!(user && ADMIN_EMAIL && user.email === ADMIN_EMAIL),
      signIn: async (email, password) => {
        const info = await cognitoSignIn(email, password);
        const appUser: AppUser = { uid: info.sub, email: info.email };
        setUser(appUser);
        return appUser;
      },
      signOut: async () => {
        await cognitoSignOut();
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
