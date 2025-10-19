import { supabase } from '@/integrations/supabase/client';

export interface ProfileData {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  role: 'student' | 'instructor' | 'admin';
  avatarUrl?: string;
  career?: string;
  phone?: string;
  bio?: string;
  country?: string;
  state?: string;
  postalCode?: string;
  taxId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  career?: string;
  phone?: string;
  bio?: string;
  country?: string;
  state?: string;
  postalCode?: string;
  taxId?: string;
}

export class ProfileService {
  /**
   * Check if avatars storage bucket exists and is properly configured
   */
  private static async ensureStorageBucketExists(): Promise<void> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        throw new Error(`Failed to check storage configuration: ${error.message}`);
      }

      const avatarsBucket = buckets?.find(bucket => bucket.id === 'avatars');
      
      if (!avatarsBucket) {
        throw new Error('Storage bucket "avatars" not found. Please run the setup script in Supabase SQL Editor: scripts/setup-avatar-storage.sql');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Map camelCase field names to snake_case column names for database
   */
  private static mapToColumnNames(data: Record<string, any>): Record<string, any> {
    const columnMapping: Record<string, string> = {
      fullName: 'full_name',
      firstName: 'first_name',
      lastName: 'last_name',
      avatarUrl: 'avatar_url',
      postalCode: 'postal_code',
      taxId: 'tax_id',
    };

    return Object.fromEntries(
      Object.entries(data)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [columnMapping[key] || key, value])
    );
  }

  /**
   * Get profile by user ID
   */
  static async getProfile(userId: string): Promise<ProfileData | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        fullName: (data as any).full_name || undefined,
        firstName: (data as any).first_name || undefined,
        lastName: (data as any).last_name || undefined,
        role: data.role as 'student' | 'instructor' | 'admin',
        avatarUrl: (data as any).avatar_url || undefined,
        career: (data as any).career || undefined,
        phone: (data as any).phone || undefined,
        bio: (data as any).bio || undefined,
        country: (data as any).country || undefined,
        state: (data as any).state || undefined,
        postalCode: (data as any).postal_code || undefined,
        taxId: (data as any).tax_id || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile');
    }
  }

  /**
   * Update profile
   */
  static async updateProfile(userId: string, data: UpdateProfileData): Promise<ProfileData> {
    try {
      // Filter out undefined values and map to database column names
      const cleanData = this.mapToColumnNames(data);

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(cleanData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      if (!updatedProfile) {
        throw new Error('Profile not found');
      }

      return {
        id: updatedProfile.id,
        email: updatedProfile.email,
        fullName: (updatedProfile as any).full_name || undefined,
        firstName: (updatedProfile as any).first_name || undefined,
        lastName: (updatedProfile as any).last_name || undefined,
        role: updatedProfile.role as 'student' | 'instructor' | 'admin',
        avatarUrl: (updatedProfile as any).avatar_url || undefined,
        career: (updatedProfile as any).career || undefined,
        phone: (updatedProfile as any).phone || undefined,
        bio: (updatedProfile as any).bio || undefined,
        country: (updatedProfile as any).country || undefined,
        state: (updatedProfile as any).state || undefined,
        postalCode: (updatedProfile as any).postal_code || undefined,
        taxId: (updatedProfile as any).tax_id || undefined,
        createdAt: new Date(updatedProfile.created_at),
        updatedAt: new Date(updatedProfile.updated_at),
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Create profile (usually called during user registration)
   */
  static async createProfile(userId: string, email: string, data?: Partial<UpdateProfileData>): Promise<ProfileData> {
    try {
      // Filter out undefined values and map to database column names
      const cleanData = data ? this.mapToColumnNames(data) : {};

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          ...cleanData,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create profile: ${error.message}`);
      }

      if (!newProfile) {
        throw new Error('Failed to create profile');
      }

      return {
        id: newProfile.id,
        email: newProfile.email,
        fullName: (newProfile as any).full_name || undefined,
        firstName: (newProfile as any).first_name || undefined,
        lastName: (newProfile as any).last_name || undefined,
        role: newProfile.role as 'student' | 'instructor' | 'admin',
        avatarUrl: (newProfile as any).avatar_url || undefined,
        career: (newProfile as any).career || undefined,
        phone: (newProfile as any).phone || undefined,
        bio: (newProfile as any).bio || undefined,
        country: (newProfile as any).country || undefined,
        state: (newProfile as any).state || undefined,
        postalCode: (newProfile as any).postal_code || undefined,
        taxId: (newProfile as any).tax_id || undefined,
        createdAt: new Date(newProfile.created_at),
        updatedAt: new Date(newProfile.updated_at),
      };
    } catch (error) {
      console.error('Error creating profile:', error);
      throw new Error('Failed to create profile');
    }
  }

  /**
   * Validate profile data
   */
  static validateProfileData(data: UpdateProfileData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate phone format if provided
    if (data.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(data.phone)) {
      errors.push('Invalid phone number format');
    }

    // Validate postal code format if provided
    if (data.postalCode && !/^[A-Z0-9\s\-]{3,10}$/.test(data.postalCode)) {
      errors.push('Invalid postal code format');
    }

    // Validate TAX ID format if provided
    if (data.taxId && !/^[A-Z0-9]{6,15}$/.test(data.taxId)) {
      errors.push('Invalid TAX ID format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Upload avatar image
   */
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      // Check if storage bucket exists
      await this.ensureStorageBucketExists();

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Please upload an image smaller than 5MB.');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Create upload promise with timeout
      const uploadPromise = supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000);
      });

      const { data: uploadData, error: uploadError } = await Promise.race([
        uploadPromise,
        timeoutPromise
      ]) as any;

      if (uploadError) {
        // Provide more specific error messages
        if (uploadError.message.includes('not found')) {
          throw new Error('Storage bucket not configured. Please run the setup script in Supabase SQL Editor.');
        } else if (uploadError.message.includes('permission') || uploadError.message.includes('denied')) {
          throw new Error('Permission denied. Please check your account permissions.');
        } else if (uploadError.message.includes('timeout')) {
          throw new Error('Upload timeout. Please try again with a smaller file.');
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded avatar');
      }

      return urlData.publicUrl;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload avatar');
    }
  }
}
