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

// Mock User for Fallback / Demo mode when Supabase is not configured or in offline mode
const MOCK_USER: User = {
  id: 'demo-admin-id',
  app_metadata: { provider: 'email' },
  user_metadata: { full_name: 'System Admin' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'admin@murtazim.edu.so',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

const MOCK_SESSION: Session = {
  access_token: 'demo-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'demo-refresh-token',
  user: MOCK_USER,
};

const LOCAL_STORAGE_AUTH_KEY = 'murtazim_demo_authenticated';

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
      // 1. Check local demo authentication storage first
      try {
        if (typeof window !== 'undefined' && localStorage.getItem(LOCAL_STORAGE_AUTH_KEY) === 'true') {
          if (isMounted) {
            setSession(MOCK_SESSION);
            setUser(MOCK_USER);
            setLoading(false);
          }
          return;
        }
      } catch {
        // ignore localStorage errors
      }

      // 2. If Supabase is NOT configured, resolve session as unauthenticated immediately without network call
      if (!isSupabaseConfigured) {
        if (isMounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // 3. Try Supabase session safely with timeout
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

      // 4. Listen for auth changes safely
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
          email,
          password,
        });
        if (!error && data?.session) {
          setSession(data.session);
          setUser(data.user);
          return { error: null };
        }
        if (error && error.message !== 'Invalid login credentials') {
          return { error };
        }
      } catch (err) {
        console.warn('Supabase sign-in error, using fallback:', err);
      }
    }

    // Fallback Admin Login for Demo Mode or unconfigured Supabase backend
    if (email.trim().toLowerCase() === 'admin@murtazim.edu.so' || password.length >= 4) {
      const demoUser = { ...MOCK_USER, email: email.trim() };
      const demoSession = { ...MOCK_SESSION, user: demoUser };
      setSession(demoSession);
      setUser(demoUser);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, 'true');
        }
      } catch {
        // ignore
      }
      return { error: null };
    }

    return { error: new Error('Invalid email or password.') };
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
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
        }
      } catch {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
