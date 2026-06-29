'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isDemoMode, dbService, UserProfile } from '@/lib/supabase';

interface AuthContextType {
  user: { email: string; id: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loginAsDemoUser: (email?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load profile details once user is resolved
  const loadProfile = async (emailStr?: string) => {
    try {
      const uProfile = await dbService.getProfile();
      if (uProfile) {
        setProfile(uProfile);
      } else if (emailStr) {
        const fallbackProfile: UserProfile = {
          id: 'demo-user-123',
          email: emailStr,
          current_level: 'A1',
          xp: 0,
          daily_streak: 1,
          last_active: new Date().toISOString(),
          goal_reason: 'Carreira',
          goal_time: '15 minutos/dia',
          created_at: new Date().toISOString(),
        };
        const updated = await dbService.updateProfile(fallbackProfile);
        setProfile(updated);
      }
    } catch (e) {
      console.error('Failed to load profile details:', e);
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  useEffect(() => {
    if (!isDemoMode && supabase) {
      // Supabase Real Mode
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            setUser({
              email: session.user.email || '',
              id: session.user.id,
            });
            await loadProfile(session.user.email);
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        }
      );

      // Initial check
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            email: session.user.email || '',
            id: session.user.id,
          });
          loadProfile(session.user.email);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Demo Mode initial load
      const session = localStorage.getItem('englishpath_session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          setUser({ email: parsed.email, id: parsed.id });
          loadProfile(parsed.email);
        } catch (e) {
          console.error('Error parsing mock session:', e);
        }
      }
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (!isDemoMode && supabase) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/dashboard`
        }
      });
      if (error) throw error;
    } else {
      // Demo Mode login trigger
      await loginAsDemoUser('explorador@englishpath.com');
    }
  };

  const signOut = async () => {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem('englishpath_session');
      setUser(null);
      setProfile(null);
    }
  };

  const loginAsDemoUser = async (email = 'explorador@englishpath.com') => {
    const mockSession = { email, id: 'demo-user-123' };
    localStorage.setItem('englishpath_session', JSON.stringify(mockSession));
    setUser(mockSession);
    await loadProfile(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        loginAsDemoUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
