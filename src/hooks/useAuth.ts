import { useEffect, useState } from 'react';
import { AuthService, AuthSession } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const currentSession = await AuthService.getCurrentSession();
        setSession(currentSession);
      } catch (error) {
        console.error('Error getting session:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const authSession = await AuthService.getCurrentSession();
          setSession(authSession);
        } else {
          setSession(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user: session?.user || null,
    profile: session?.profile || null,
    loading,
    isAuthenticated: !!session?.user,
  };
};
