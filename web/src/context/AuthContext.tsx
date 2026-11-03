import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase/env';
import { authAction, observeAuthSession } from '../lib/authSession';

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const client = useMemo(() => (configured ? getSupabaseClient() : null), [configured]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }
    return observeAuthSession(client.auth, (next, error) => {
      setSession(next);
      setAuthError(error);
      setLoading(false);
    });
  }, [client]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!client) return { error: 'Supabase is not configured on this build.' };
      return authAction(() => client.auth.signInWithPassword({ email, password }));
    },
    [client]
  );

  const signOut = useCallback(async () => {
    if (!client) return { error: null };
    return authAction(() => client.auth.signOut());
  }, [client]);

  const value: AuthContextValue = {
    configured,
    loading,
    session,
    user: session?.user ?? null,
    authError,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
