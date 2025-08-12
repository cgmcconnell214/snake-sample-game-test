import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AvatarUploadResult {
  url: string;
}

export interface UseAvatarResult {
  uploadAvatar: (file: File) => Promise<AvatarUploadResult | null>;
  removeAvatar: () => Promise<void>;
  uploading: boolean;
  progress: number;
  error: string | null;
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
          upsert: true,
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
      console.error('Avatar upload error:', err);
      const message = (err as Error).message || 'Failed to upload avatar';
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async (): Promise<void> => {
    if (!user?.id) return;

    setUploading(true);
    setError(null);

    try {
      // Get current avatar URL
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const currentUrl = profile?.avatar_url;
      if (currentUrl) {
        // Extract storage path from public URL
        const path = currentUrl.split('/avatars/')[1];
        if (path) {
          const { error: storageError } = await supabase.storage
            .from('avatars')
            .remove([path]);
          if (storageError) throw storageError;
        }
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
    } catch (err: unknown) {
      console.error('Avatar remove error:', err);
      const message = (err as Error).message || 'Failed to remove avatar';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadAvatar,
    removeAvatar,
    uploading,
    progress,
    error,
  };
}