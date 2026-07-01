import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { setUserContext, clearSentryContext } from '../lib/sentry';
import { resetUser } from '../lib/analytics';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  aal: 'aal1' | 'aal2' | null;
  setAal: (level: 'aal1' | 'aal2' | null) => void;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  loginWithGoogle: () => Promise<{ error: AuthError | null }>;
  registerTenant: (payload: {
    email: string;
    password: string;
    fullName: string;
    companyName: string;
    planName?: string;
  }) => Promise<{ error: Error | AuthError | null }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [aal, setAal] = useState<'aal1' | 'aal2' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error fetching session:', error);
          if (
            error.message.includes('refresh_token_not_found') ||
            error.message.includes('invalid_grant')
          ) {
            await supabase.auth.signOut();
          }
        }

        if (session?.user) {
          setUser({
            id: session.user.id,
            name:
              session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: (session.user.user_metadata?.role as 'admin' | 'user') || 'user',
          });
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalData) {
            setAal(aalData.currentLevel as 'aal1' | 'aal2' | null);
          } else {
            setAal('aal1');
          }
        } else {
          setAal(null);
        }
      } catch (err) {
        console.error('Unexpected auth error:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as 'admin' | 'user') || 'user',
        });

        // Fetch AAL asynchronously but wait for it before dropping the loading shield
        try {
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalData) {
            setAal(aalData.currentLevel as 'aal1' | 'aal2' | null);
          } else {
            setAal('aal1');
          }
        } catch (e) {
          console.error(e);
          setAal('aal1');
        }
      } else {
        setUser(null);
        setAal(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    clearSentryContext();
    resetUser(); // Reset analytics user identity
  };

  const registerTenant = async (payload: {
    email: string;
    password: string;
    fullName: string;
    companyName: string;
    planName?: string;
  }) => {
    try {
      // 1. Criar usuário no auth auth (gera o UUID)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            full_name: payload.fullName,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      const newUserId = authData.user?.id;
      if (!newUserId) {
        throw new Error('Falha ao criar usuário. ID não retornado.');
      }

      // 2. Chamar a RPC transacionada no banco para criar toda a estrutura do Tenant de forma atômica
      const rpcPayload: any = {
        p_user_id: newUserId,
        p_email: payload.email,
        p_full_name: payload.fullName,
        p_company_name: payload.companyName,
      };

      if (payload.planName) {
        rpcPayload.p_plano = payload.planName;
      }

      const { error: rpcError } = await supabase.rpc('register_new_tenant', rpcPayload);

      if (rpcError) {
        throw rpcError;
      }

      return { error: null };
    } catch (error: any) {
      console.error('Erro no registro do tenant:', error);
      return { error: error as Error | AuthError };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        aal,
        setAal,
        login,
        loginWithGoogle,
        registerTenant,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
