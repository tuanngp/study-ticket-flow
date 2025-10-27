import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService, AuthSession, UserProfile } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAuth = async () => {
    try {
      setError(null);
      const currentSession = await AuthService.getCurrentSession();
      setSession(currentSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setSession(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentSession = await AuthService.getCurrentSession();

        if (mounted) {
          setSession(currentSession);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Authentication failed');
          setSession(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        try {
          if (event === 'SIGNED_OUT' || !session) {
            setSession(null);
            setLoading(false);
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const minimalSession = {
              user: session.user,
              profile: {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                role: session.user.user_metadata?.role || 'student',
              }
            };
            setSession(minimalSession);
            setLoading(false);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Authentication failed');
          setSession(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user: session?.user || null,
    profile: session?.profile || null,
    loading,
    isAuthenticated: !!session?.user,
    error,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
