-- Fix critical security vulnerability in user_profiles table
-- This addresses the issue where personal information could be harvested by attackers

-- 1. First, let's ensure the table has proper privacy controls
-- Update user_profiles to have better defaults for privacy
ALTER TABLE public.user_profiles 
ALTER COLUMN is_public SET DEFAULT false,
ALTER COLUMN privacy_settings SET DEFAULT jsonb_build_object(
  'profile_visibility', 'private',
  'phone_visibility', 'private', 
  'location_visibility', 'private',
  'website_visibility', 'public',
  'social_links_visibility', 'public',
  'bio_visibility', 'public'
);

-- 2. Drop the insecure function that exposes all user data
DROP FUNCTION IF EXISTS public.get_public_user_profiles();

-- 3. Create a secure function that respects privacy settings
CREATE OR REPLACE FUNCTION public.get_public_user_profiles()
RETURNS TABLE(
  user_id uuid, 
  display_name text, 
  username text, 
  bio text, 
  avatar_url text,
  website text,
  social_links jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    CASE 
      WHEN up.is_public = true OR (up.privacy_settings->>'profile_visibility') = 'public' 
      THEN up.display_name 
      ELSE NULL 
    END as display_name,
    CASE 
      WHEN up.is_public = true OR (up.privacy_settings->>'profile_visibility') = 'public' 
      THEN up.username 
      ELSE NULL 
    END as username,
    CASE 
      WHEN up.is_public = true OR (up.privacy_settings->>'bio_visibility') = 'public' 
      THEN up.bio 
      ELSE NULL 
    END as bio,
    up.avatar_url, -- Avatar is always visible for UI purposes
    CASE 
      WHEN up.is_public = true OR (up.privacy_settings->>'website_visibility') = 'public' 
      THEN up.website 
      ELSE NULL 
    END as website,
    CASE 
      WHEN up.is_public = true OR (up.privacy_settings->>'social_links_visibility') = 'public' 
      THEN up.social_links 
      ELSE NULL 
    END as social_links
  FROM public.user_profiles up 
  WHERE up.is_public = true 
     OR (up.privacy_settings->>'profile_visibility') = 'public';
END;
$$;

-- 4. Create a secure function for getting user profile details (for viewing other users)
CREATE OR REPLACE FUNCTION public.get_user_profile_secure(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text, 
  bio text,
  avatar_url text,
  website text,
  social_links jsonb,
  location text,
  follower_count integer,
  following_count integer,
  post_count integer,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_record public.user_profiles%ROWTYPE;
  requesting_user_id uuid := auth.uid();
BEGIN
  -- Get the profile record
  SELECT * INTO profile_record 
  FROM public.user_profiles 
  WHERE user_profiles.user_id = target_user_id;
  
  -- If profile doesn't exist, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- If requesting user is the profile owner or admin, return full profile
  IF requesting_user_id = target_user_id OR 
     (SELECT get_current_user_role()) = 'admin' THEN
    RETURN QUERY
    SELECT 
      profile_record.user_id,
      profile_record.display_name,
      profile_record.username,
      profile_record.bio,
      profile_record.avatar_url,
      profile_record.website,
      profile_record.social_links,
      profile_record.location,
      profile_record.follower_count,
      profile_record.following_count,
      profile_record.post_count,
      profile_record.created_at;
    RETURN;
  END IF;
  
  -- For other users, respect privacy settings
  RETURN QUERY
  SELECT 
    profile_record.user_id,
    CASE 
      WHEN profile_record.is_public = true OR (profile_record.privacy_settings->>'profile_visibility') = 'public' 
      THEN profile_record.display_name 
      ELSE 'Private User'::text 
    END as display_name,
    CASE 
      WHEN profile_record.is_public = true OR (profile_record.privacy_settings->>'profile_visibility') = 'public' 
      THEN profile_record.username 
      ELSE NULL 
    END as username,
    CASE 
      WHEN profile_record.is_public = true OR (profile_record.privacy_settings->>'bio_visibility') = 'public' 
      THEN profile_record.bio 
      ELSE NULL 
    END as bio,
    profile_record.avatar_url, -- Always visible for UI
    CASE 
      WHEN profile_record.is_public = true OR (profile_record.privacy_settings->>'website_visibility') = 'public' 
      THEN profile_record.website 
      ELSE NULL 
    END as website,
    CASE 
      WHEN profile_record.is_public = true OR (profile_record.privacy_settings->>'social_links_visibility') = 'public' 
      THEN profile_record.social_links 
      ELSE NULL 
    END as social_links,
    CASE 
      WHEN profile_record.is_public = true OR (profile_record.privacy_settings->>'location_visibility') = 'public' 
      THEN profile_record.location 
      ELSE NULL 
    END as location,
    CASE 
      WHEN profile_record.is_public = true OR (profile_record.privacy_settings->>'profile_visibility') = 'public' 
      THEN profile_record.follower_count 
      ELSE NULL 
    END as follower_count,
    CASE 
      WHEN profile_record.is_public = true OR (profile_record.privacy_settings->>'profile_visibility') = 'public' 
      THEN profile_record.following_count 
      ELSE NULL 
    END as following_count,
    CASE 
      WHEN profile_record.is_public = true OR (profile_record.privacy_settings->>'profile_visibility') = 'public' 
      THEN profile_record.post_count 
      ELSE NULL 
    END as post_count,
    profile_record.created_at;
END;
$$;

-- 5. Clean up duplicate/conflicting RLS policies and create secure ones
DROP POLICY IF EXISTS "Users can view their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can modify their own user_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;

-- 6. Create comprehensive, secure RLS policies
CREATE POLICY "users_can_view_own_profiles" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_view_public_profiles" ON public.user_profiles
  FOR SELECT 
  USING (
    auth.uid() != user_id AND (
      is_public = true OR 
      (privacy_settings->>'profile_visibility') = 'public'
    )
  );

CREATE POLICY "users_can_manage_own_profiles" ON public.user_profiles
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Add a trigger to ensure privacy settings are set on insert
CREATE OR REPLACE FUNCTION public.ensure_user_profile_privacy()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure privacy settings are set with secure defaults
  IF NEW.privacy_settings IS NULL THEN
    NEW.privacy_settings := jsonb_build_object(
      'profile_visibility', 'private',
      'phone_visibility', 'private',
      'location_visibility', 'private', 
      'website_visibility', 'public',
      'social_links_visibility', 'public',
      'bio_visibility', 'public'
    );
  END IF;
  
  -- Ensure is_public defaults to false if not set
  IF NEW.is_public IS NULL THEN
    NEW.is_public := false;
  END IF;
  
  -- Log any attempts to access sensitive data
  IF TG_OP = 'UPDATE' AND OLD.phone IS DISTINCT FROM NEW.phone THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      event_data,
      risk_score
    ) VALUES (
      NEW.user_id,
      'profile_phone_update',
      jsonb_build_object('old_phone_set', OLD.phone IS NOT NULL, 'new_phone_set', NEW.phone IS NOT NULL),
      2
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER user_profile_privacy_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_profile_privacy();

-- 8. Add indexes for better performance on privacy queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_privacy_public 
  ON public.user_profiles (is_public) 
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_privacy_settings 
  ON public.user_profiles USING GIN (privacy_settings) 
  WHERE privacy_settings->>'profile_visibility' = 'public';

-- 9. Add a security audit function
CREATE OR REPLACE FUNCTION public.audit_user_profile_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile views for security monitoring
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL AND auth.uid() != NEW.user_id THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      event_data,
      risk_score
    ) VALUES (
      auth.uid(),
      'profile_view',
      jsonb_build_object('viewed_user_id', NEW.user_id, 'is_public', NEW.is_public),
      1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_public_user_profiles() IS 'Securely returns only public user profiles with respect to privacy settings';
COMMENT ON FUNCTION public.get_user_profile_secure(uuid) IS 'Securely returns user profile data based on privacy settings and relationship to requesting user';