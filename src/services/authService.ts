import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthSession {
  user: any;
  profile: UserProfile | null;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(data: SignUpData): Promise<{ user: any; error?: string }> {
    try {
      const { data: result, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return { user: result.user };
    } catch (error: any) {
      console.error('Error in signUp:', error);
      return { user: null, error: error.message };
    }
  }

  /**
   * Sign in an existing user
   */
  static async signIn(data: SignInData): Promise<{ user: any; error?: string }> {
    try {
      const { data: result, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { user: result.user };
    } catch (error: any) {
      console.error('Error in signIn:', error);
      return { user: null, error: error.message };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      return {};
    } catch (error: any) {
      console.error('Error in signOut:', error);
      return { error: error.message };
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<{ data: { user: any } }> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        throw new Error(error.message);
      }

      return { data };
    } catch (error: any) {
      console.error('Error in getCurrentUser:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user session and profile
   */
  static async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      if (!session) {
        return null;
      }

      const profile = await this.ensureUserProfile(session.user);

      return {
        user: session.user,
        profile
      };
    } catch (error) {
      console.error('Error in getCurrentSession:', error);
      return null;
    }
  }

  /**
   * Ensure a profile exists for the user, creating one if necessary
   */
  static async ensureUserProfile(user: any): Promise<UserProfile | null> {
    try {
      // First try to get existing profile
      let profile = await this.getUserProfile(user.id);

      if (!profile) {
        // Profile doesn't exist, create one
        console.log('Profile not found, creating new profile for user:', user.id);

        const { data, error } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            role: user.user_metadata?.role || 'student',
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating user profile:', error);
          // If profile creation fails, try to get it again in case it was created by another process
          profile = await this.getUserProfile(user.id);
          if (!profile) {
            console.error('Failed to create or retrieve profile');
            return null;
          }
        } else {
          profile = data;
          console.log('Profile created successfully:', profile);
        }
      }

      return profile;
    } catch (error) {
      console.error('Error in ensureUserProfile:', error);
      return null;
    }
  }

  /**
   * Get user profile by user ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error('Error getting user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated and redirect if not
   */
  static async requireAuth(): Promise<AuthSession> {
    const session = await this.getCurrentSession();

    if (!session) {
      throw new Error('Authentication required');
    }

    return session;
  }
}
