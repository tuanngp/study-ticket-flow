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

      // If user was created successfully, ensure profile is created
      if (result.user) {
        console.log('User created, ensuring profile...');
        await this.ensureUserProfile(result.user);
      }

      return { user: result.user };
    } catch (error: any) {
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
      throw error;
    }
  }

  /**
   * Get current authenticated user session and profile
   */
  static async getCurrentSession(): Promise<AuthSession | null> {
    try {
      console.log('Getting current session...');

      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Session result:', { hasSession: !!session, error: error?.message });

      if (error) {
        console.error('Error getting session:', error);
        return null;
      }

      if (!session) {
        return null;
      }

      console.log('Session found, ensuring profile...');
      const profile = await this.ensureUserProfile(session.user);
      console.log('Profile ensured:', !!profile);

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
      console.log('Ensuring profile for user:', user.id);

      // First, try to get existing profile
      const existingProfile = await this.getUserProfile(user.id);
      if (existingProfile) {
        console.log('Profile already exists:', existingProfile);
        return existingProfile;
      }

      // If no profile exists, create one
      console.log('Creating new profile for user:', user.id);
      const profileData = {
        email: user.email,
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
        role: (user.user_metadata?.role || 'student') as 'student' | 'instructor' | 'admin',
      };

      const createdProfile = await this.createProfile(user.id, profileData);

      if (createdProfile) {
        return createdProfile;
      }

      // Return minimal profile as fallback if creation failed
      return {
        id: user.id,
        email: user.email,
        full_name: profileData.fullName,
        role: profileData.role,
      };
    } catch (error) {
      console.error('Error in ensureUserProfile:', error);

      // Return minimal profile as fallback
      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
        role: user.user_metadata?.role || 'student',
      };
    }
  }

  /**
   * Create a new profile for a user
   */
  static async createProfile(userId: string, profileData: {
    email: string;
    fullName: string;
    role: 'student' | 'instructor' | 'admin';
  }): Promise<UserProfile | null> {
    try {
      console.log('Creating profile for user:', userId, profileData);

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: profileData.email,
          full_name: profileData.fullName,
          role: profileData.role,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      console.log('Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in createProfile:', error);
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
