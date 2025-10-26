import { supabase } from '@/integrations/supabase/client';

export class ImageUploadService {
  /**
   * Upload images to Supabase Storage
   */
  static async uploadImages(files: File[]): Promise<string[]> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${index}.${fileExt}`;
        const filePath = `ticket-images/${fileName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('ticket-images')
          .upload(filePath, file);

        if (error) {
          console.error('Upload error:', error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('ticket-images')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      console.log('Uploaded image URLs:', urls);
      return urls;

    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error('Failed to upload images. Please try again.');
    }
  }

  /**
   * Check if storage bucket exists
   */
  static async checkStorageBucket(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error checking buckets:', error);
        return false;
      }

      const ticketImagesBucket = data.find(bucket => bucket.name === 'ticket-images');
      return !!ticketImagesBucket;

    } catch (error) {
      console.error('Storage check failed:', error);
      return false;
    }
  }

  /**
   * Create storage bucket if it doesn't exist
   */
  static async createStorageBucket(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.createBucket('ticket-images', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }

      console.log('Storage bucket created successfully');
      return true;

    } catch (error) {
      console.error('Failed to create storage bucket:', error);
      return false;
    }
  }
}
