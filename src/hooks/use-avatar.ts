import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AvatarUploadResult {
  url: string;
}

export function useAvatar() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const uploadAvatar = async (file: File): Promise<AvatarUploadResult | null> => {
    if (!file || !user?.id) return null;
    
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Create unique filename
      const fileName = `${user.id}/avatar-${Date.now()}.${file.name.split('.').pop()}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update both user profiles with the new avatar URL
      const updates = [
        // Update main profile
        supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('user_id', user.id),
        
        // Update user_profiles
        supabase
          .from('user_profiles')
          .update({ avatar_url: publicUrl })
          .eq('user_id', user.id)
      ];

      await Promise.all(updates);

      // Call refreshProfile to update the context
      await refreshProfile();

      return { url: publicUrl };
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Failed to upload avatar');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadAvatar,
    uploading,
    progress,
    error,
  };
}