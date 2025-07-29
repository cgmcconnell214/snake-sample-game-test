import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AvatarUploadResult {
  url: string;
}

export interface UseAvatarResult {
  uploadAvatar: (file: File) => Promise<AvatarUploadResult | null>
  uploading: boolean
  progress: number
  error: string | null
}

export function useAvatar(): UseAvatarResult {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshProfile } = useAuth();

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

      // Update user_profiles - this will automatically sync to profiles via trigger
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      // Call refreshProfile to update the context
      await refreshProfile();

      return { url: publicUrl };
    } catch (err: unknown) {
 xgqza0-codex/replace-instances-of-any-with-correct-types

 codex/replace-all-instances-of-any-in-codebase

 codex/replace-any-with-correct-typescript-types
      // TODO: Verify correct error type
 main
      console.error('Avatar upload error:', err);
      const error = err as Error;
      setError(error.message || 'Failed to upload avatar');
      throw error;

 main
      console.error('Avatar upload error:', err);
 codex/replace-instances-of-any-with-correct-types
      const error = err as Error;
      setError(error.message || 'Failed to upload avatar');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message || 'Failed to upload avatar');
 main
      throw err;
 main
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