/**
 * Provides global authentication context for the app.
 * Needed to share auth state and actions across components.
 * Assumes Supabase client and React context usage.
 * Edge cases: context not provided, auth state desync, token expiry.
 * Used by AuthForm, Navigation, and protected routes.
 */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

import type { SupabaseClient, User } from "@supabase/supabase-js";

type SupabaseContext = {
  supabase: SupabaseClient;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

  /**
   * Wraps children with authentication context provider.
   * Needed to enable global auth state and actions. Assumes children are React nodes.
   * Edge cases: missing children, context misuse.
   * Used at the app root.
   */
export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <Context.Provider value={{ supabase, user, loading, signOut }}>
      <>{children}</>
    </Context.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
