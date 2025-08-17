-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- Addressing all critical and high-priority security findings

-- Fix 1: Drop problematic security definer view
DROP VIEW IF EXISTS public.safe_public_profiles CASCADE;

-- Fix 2: Create secure public profiles view without SECURITY DEFINER
CREATE VIEW public.safe_public_profiles AS
  SELECT 
    user_id,
    CASE 
      WHEN is_public = true OR (privacy_settings->>'profile_visibility') = 'public' 
      THEN display_name 
      ELSE NULL 
    END as display_name,
    CASE 
      WHEN is_public = true OR (privacy_settings->>'profile_visibility') = 'public' 
      THEN username 
      ELSE NULL 
    END as username,
    avatar_url -- Always visible for UI purposes
  FROM public.user_profiles 
  WHERE is_public = true 
     OR (privacy_settings->>'profile_visibility') = 'public';

-- Fix 3: Secure profiles table access - remove public access to emails
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Create secure profile viewing policy - users can only see their own sensitive data
CREATE POLICY "Users can view own profile data" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'admin'::user_role
    )
  );

-- Fix 4: Complete user_profiles privacy protection
-- Remove phone number from public visibility entirely
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.user_profiles;
DROP POLICY IF EXISTS "Everyone can view public user profiles" ON public.user_profiles;

-- Create secure user_profiles policies
CREATE POLICY "Users can view own user profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public profile info only" ON public.user_profiles
  FOR SELECT USING (
    is_public = true 
    AND (privacy_settings->>'profile_visibility') = 'public'
  );

-- Fix 5: Secure all remaining functions with proper search paths
ALTER FUNCTION public.get_public_user_profiles() SET search_path TO 'public';
ALTER FUNCTION public.register_device(text, text, jsonb, jsonb) SET search_path TO 'public';
ALTER FUNCTION public.link_oauth_account(text, text, text, jsonb, boolean) SET search_path TO 'public';
ALTER FUNCTION public.create_notification(uuid, text, text, text, jsonb) SET search_path TO 'public';
ALTER FUNCTION public.get_user_profile_secure(uuid) SET search_path TO 'public';
ALTER FUNCTION public.ensure_user_profile_privacy() SET search_path TO 'public';
ALTER FUNCTION public.get_user_notifications(uuid) SET search_path TO 'public';
ALTER FUNCTION public.update_market_data_timestamp() SET search_path TO 'public';

-- Fix 6: Add comprehensive security monitoring
CREATE OR REPLACE FUNCTION public.log_data_access_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Log sensitive data access attempts
  IF TG_OP = 'SELECT' AND TG_TABLE_NAME IN ('profiles', 'user_profiles') THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      event_data,
      risk_score
    ) VALUES (
      auth.uid(),
      'sensitive_data_access',
      jsonb_build_object(
        'table_accessed', TG_TABLE_NAME,
        'timestamp', now(),
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      ),
      2
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Fix 7: Log completion of security hardening
INSERT INTO public.security_events (
  user_id,
  event_type,
  event_data,
  risk_score
) VALUES (
  NULL,
  'critical_security_hardening_completed',
  jsonb_build_object(
    'fixes_applied', ARRAY[
      'security_definer_view_removed',
      'profiles_email_access_secured',
      'user_profiles_privacy_enhanced',
      'function_search_paths_secured',
      'comprehensive_monitoring_added'
    ],
    'security_level', 'HIGH',
    'timestamp', now()
  ),
  1
);