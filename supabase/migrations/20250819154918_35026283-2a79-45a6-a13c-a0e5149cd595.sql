-- Phase 2: Additional Security Hardening

-- 1. Create function to clean up expired sessions and tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clean up expired rate limits
  DELETE FROM public.rate_limits 
  WHERE expires_at < now();
  
  -- Clean up old security events (keep last 30 days)
  DELETE FROM public.security_events 
  WHERE created_at < now() - INTERVAL '30 days'
    AND risk_score < 5; -- Keep high-risk events longer
  
  -- Clean up expired meeting tokens
  DELETE FROM public.meeting_access_tokens 
  WHERE expires_at < now();
  
  -- Log cleanup activity
  INSERT INTO public.security_events (
    event_type,
    event_data,
    risk_score
  ) VALUES (
    'system_cleanup',
    jsonb_build_object(
      'cleanup_timestamp', now(),
      'automated_cleanup', true
    ),
    1
  );
END;
$$;

-- 2. Create enhanced audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all admin actions for audit trail
  INSERT INTO public.security_events (
    user_id,
    event_type,
    event_data,
    risk_score
  ) VALUES (
    auth.uid(),
    'admin_action',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', COALESCE(NEW.id, OLD.id),
      'timestamp', now()
    ),
    3
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Create triggers for admin action logging on sensitive tables
DROP TRIGGER IF EXISTS log_admin_sacred_law ON public.sacred_law_principles;
CREATE TRIGGER log_admin_sacred_law
  AFTER INSERT OR UPDATE OR DELETE ON public.sacred_law_principles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_action();

DROP TRIGGER IF EXISTS log_admin_network_nodes ON public.network_nodes;
CREATE TRIGGER log_admin_network_nodes
  AFTER INSERT OR UPDATE OR DELETE ON public.network_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_action();

-- 4. Enhanced function security for user profile access
CREATE OR REPLACE FUNCTION public.get_user_profile_secure(target_user_id uuid)
RETURNS TABLE(user_id uuid, display_name text, username text, bio text, avatar_url text, website text, social_links jsonb, location text, follower_count integer, following_count integer, post_count integer, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_record public.user_profiles%ROWTYPE;
  requesting_user_id uuid := auth.uid();
BEGIN
  -- Log access attempt for security monitoring
  INSERT INTO public.security_events (
    user_id,
    event_type,
    event_data,
    risk_score
  ) VALUES (
    requesting_user_id,
    'profile_access_attempt',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'timestamp', now()
    ),
    1
  );

  -- Get the profile record
  SELECT * INTO profile_record 
  FROM public.user_profiles 
  WHERE user_profiles.user_id = target_user_id;
  
  -- If profile doesn't exist, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- If requesting user is the profile owner or admin, return full profile
  IF requesting_user_id = target_user_id OR public.is_admin() THEN
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
    profile_record.avatar_url,
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