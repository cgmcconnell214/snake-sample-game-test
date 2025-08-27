-- Fix remaining security issues

-- First, drop the problematic Security Definer View
DROP VIEW IF EXISTS public.safe_public_profiles;

-- Create a secure function instead of a view for getting public profiles
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE(
    user_id UUID,
    display_name TEXT,
    username TEXT,
    avatar_url TEXT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        up.user_id,
        up.display_name,
        up.username,
        up.avatar_url
    FROM public.user_profiles up
    WHERE up.is_public = true 
       OR (up.privacy_settings->>'profile_visibility') = 'public'
       OR up.privacy_settings IS NULL;
$$;

-- Update the existing is_admin function to use the new role system
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT public.current_user_has_role('admin');
$$;

-- Fix the is_admin_bypass_rls function as well
CREATE OR REPLACE FUNCTION public.is_admin_bypass_rls()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT public.current_user_has_role('admin');
$$;

-- Update get_current_user_role to use the new role system
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO anon;