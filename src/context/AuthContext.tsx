'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithPassword: async () => ({ error: null }),
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    async function initAuth() {
      // If Supabase is NOT configured, resolve session as unauthenticated immediately without network call
      if (!isSupabaseConfigured) {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Try Supabase session safely with timeout
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Supabase auth session timeout')), 3000)
        );
        const { data } = await Promise.race([supabase.auth.getSession(), timeoutPromise]);

        if (isMounted) {
          if (data?.session) {
            setSession(data.session);
            setUser(data.session.user);
          } else {
            setSession(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Supabase getSession failed or timed out:', err);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }

      // Listen for auth changes safely
      try {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (isMounted) {
            if (session) {
              setSession(session);
              setUser(session.user);
            } else {
              setSession(null);
              setUser(null);
            }
          }
        });
        authSubscription = data?.subscription || null;
      } catch (err) {
        console.warn('Supabase onAuthStateChange failed:', err);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          return { error };
        }
        if (data?.session) {
          setSession(data.session);
          setUser(data.user);
          return { error: null };
        }
      } catch (err) {
        return { error: err instanceof Error ? err : new Error('Sign in failed') };
      }
    }

    return { error: new Error('Supabase authentication is not configured.') };
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Error signing out of Supabase:', err);
    } finally {
      setSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
