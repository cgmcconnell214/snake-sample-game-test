import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecureUserProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  social_links: any;
  location: string | null;
  follower_count: number | null;
  following_count: number | null;
  post_count: number | null;
  created_at: string | null;
}

/**
 * Hook for securely fetching user profiles that respects privacy settings
 * Never exposes sensitive data like phone numbers to unauthorized users
 */
export function useSecureUserProfile(targetUserId: string | null) {
  const [profile, setProfile] = useState<SecureUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetUserId) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if this is the current user's own profile
        const currentUser = (await supabase.auth.getUser()).data.user;
        const isOwnProfile = currentUser?.id === targetUserId;

        if (isOwnProfile) {
          // For own profile, get data directly (still filtered by RLS)
          const { data, error } = await supabase
            .from('user_profiles')
            .select(`
              user_id,
              display_name,
              username,
              bio,
              avatar_url,
              website,
              social_links,
              location,
              follower_count,
              following_count,
              post_count,
              created_at
            `)
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (error) throw error;
          setProfile(data);
        } else {
          // For other users, use secure function that respects privacy
          const { data, error } = await supabase
            .rpc('get_user_profile_secure', { target_user_id: targetUserId });

          if (error) throw error;

          if (data && data.length > 0) {
            setProfile(data[0]);
          } else {
            // Profile is private or doesn't exist - provide minimal safe data
            setProfile({
              user_id: targetUserId,
              display_name: 'Private User',
              username: null,
              bio: null,
              avatar_url: null,
              website: null,
              social_links: null,
              location: null,
              follower_count: null,
              following_count: null,
              post_count: null,
              created_at: null,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching secure user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetUserId]);

  return { profile, loading, error };
}

/**
 * Hook for getting basic public profile info for UI components like avatars and names
 * Only returns publicly available data, never sensitive information
 */
export function usePublicProfileInfo(targetUserId: string | null) {
  const [profileInfo, setProfileInfo] = useState<{
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!targetUserId) {
      setProfileInfo(null);
      return;
    }

    const fetchBasicInfo = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('safe_public_profiles')
          .select('display_name, username, avatar_url')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (error) throw error;
        
        setProfileInfo(data || {
          display_name: 'Private User',
          username: null,
          avatar_url: null,
        });
      } catch (err) {
        console.error('Error fetching public profile info:', err);
        setProfileInfo({
          display_name: 'Unknown User',
          username: null,
          avatar_url: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBasicInfo();
  }, [targetUserId]);

  return { profileInfo, loading };
}