import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase";
import { formatAuthError } from "../utils/authErrors";

type AuthResult = {
  error: string | null;
  /** Set when sign-up succeeded but email confirmation is required */
  needsEmailConfirmation?: boolean;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: formatAuthError(error) };
  };

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      return { error: formatAuthError(error) };
    }

    // Confirm-email off → session returned immediately
    if (data.session) {
      return { error: null };
    }

    // Confirm-email on → user created but must verify inbox
    if (data.user && !data.session) {
      return {
        error: null,
        needsEmailConfirmation: true,
      };
    }

    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (err) {
      console.warn("Supabase auth.signOut error:", err);
    } finally {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("sb-") || key.includes("supabase.auth.token"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (err) {
        console.warn("LocalStorage clear error:", err);
      }
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
