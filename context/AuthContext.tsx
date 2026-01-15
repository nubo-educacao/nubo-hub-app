'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar: string;
}

export type PendingAction = 
  | { type: 'chat'; payload: { message: string } }
  | { type: 'favorite'; payload: { opportunityId: string } }
  | { type: 'redirect'; payload: { url: string } }
  | null;

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  signInWithWhatsapp: (phone: string) => Promise<{ error: any }>;
  signInWithDemo: (phone: string) => Promise<{ error: any }>;
  verifyOtp: (phone: string, token: string) => Promise<{ data: { session: Session | null; user: SupabaseUser | null }; error: any }>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  pendingAction: PendingAction;
  setPendingAction: (action: PendingAction) => void;
  clearPendingAction: () => void;
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        mapSupabaseUserToUser(session.user).then(setUser);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        mapSupabaseUserToUser(session.user).then(setUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUserToUser = async (sbUser: SupabaseUser): Promise<User> => {
    return {
      id: sbUser.id,
      name: sbUser.user_metadata?.full_name || sbUser.phone || 'Usuário',
      email: sbUser.email,
      phone: sbUser.phone,
      avatar: sbUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id}`,
    };
  };

  const signInWithWhatsapp = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: 'whatsapp',
      },
    });
    return { error };
  };

  const signInWithDemo = async (phone: string) => {
    // Demo Mode: Map phone to fake email
    const cleanPhone = phone.replace(/\D/g, '');
    const fakeEmail = `${cleanPhone}@demo.com`;
    const fakePassword = 'demo-password-123';

    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: fakePassword,
    });

    if (signInError && signInError.message.includes('Invalid login credentials')) {
      // User doesn't exist, sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: fakePassword,
        options: {
          data: {
            phone: phone,
            full_name: `Demo User ${cleanPhone.slice(-4)}`,
          },
        },
      });

      if (signUpData.session) {
        setSession(signUpData.session);
        return { error: null };
      }
      return { error: signUpError };
    }

    return { error: signInError };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms', // Supabase uses 'sms' type for phone verification even if channel is whatsapp
    });
    
    if (data.session) {
      if (pendingAction?.type === 'redirect') {
        router.push(pendingAction.payload.url);
        setPendingAction(null);
        setIsAuthModalOpen(false);
      } else if (pendingAction?.type === 'chat') {
        // Don't close modal for chat action, let the chat page/component handle it
      } else {
        setIsAuthModalOpen(false);
      }
    }
    
    return { data, error };
  };

  const login = () => {
    openAuthModal();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPendingAction(null);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const clearPendingAction = () => setPendingAction(null);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session,
        user,
        session,
        isLoading,
        login,
        logout,
        signInWithWhatsapp,
        signInWithDemo,
        verifyOtp,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        pendingAction,
        setPendingAction,
        clearPendingAction,
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
