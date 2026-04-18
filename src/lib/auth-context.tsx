'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/lib/types';
import { db } from '@/lib/db';
import { supabase, SUPABASE_CONFIGURED } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session ────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      // 1. Restore seed/staff session from sessionStorage
      const stored = sessionStorage.getItem('cabinet_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const fresh  = db.getUserById(parsed.id);
          if (fresh) { setUser(fresh); setIsLoading(false); return; }
        } catch { sessionStorage.removeItem('cabinet_session'); }
      }

      // 2. Restore Supabase session (patients)
      if (SUPABASE_CONFIGURED && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(supabaseUserToUser(session.user));
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
    };
    restore();
  }, []);

  // ── Login ──────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // 1. Try mock db (staff + seed patient)
    const mockUser = db.login(email, password);
    if (mockUser) {
      setUser(mockUser);
      sessionStorage.setItem('cabinet_session', JSON.stringify(mockUser));
      setIsLoading(false);
      return { success: true };
    }

    // 2. Try Supabase (real patients created after appointment confirmation)
    if (SUPABASE_CONFIGURED && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (data?.user && !error) {
        setUser(supabaseUserToUser(data.user));
        setIsLoading(false);
        return { success: true };
      }
    }

    setIsLoading(false);
    return { success: false, error: 'Email ou mot de passe incorrect' };
  };

  // ── Logout ─────────────────────────────────────────────────────
  const logout = () => {
    sessionStorage.removeItem('cabinet_session');
    if (SUPABASE_CONFIGURED && supabase) supabase.auth.signOut().catch(() => {});
    setUser(null);
  };

  const hasRole = (roles: UserRole[]): boolean => !!user && roles.includes(user.role);

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = db.updateUser(user.id, updates);
    if (updated) {
      setUser(updated);
      sessionStorage.setItem('cabinet_session', JSON.stringify(updated));
    } else {
      // Supabase user — update metadata
      if (SUPABASE_CONFIGURED && supabase) {
        const meta: Record<string, any> = {};
        if (updates.firstName) meta.firstName = updates.firstName;
        if (updates.lastName)  meta.lastName  = updates.lastName;
        supabase.auth.updateUser({ data: meta });
      }
      setUser(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

// ── Helpers ────────────────────────────────────────────────────
function supabaseUserToUser(sbUser: any): User {
  const meta = sbUser.user_metadata ?? {};
  return {
    id:        sbUser.id,
    email:     sbUser.email ?? '',
    firstName: meta.firstName ?? (sbUser.email?.split('@')[0] ?? ''),
    lastName:  meta.lastName  ?? '',
    role:      (meta.role as UserRole) ?? 'patient',
    isActive:  true,
    createdAt: new Date(sbUser.created_at),
    updatedAt: new Date(sbUser.updated_at ?? sbUser.created_at),
  };
}
