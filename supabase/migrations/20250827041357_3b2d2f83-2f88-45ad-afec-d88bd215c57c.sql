-- Fix infinite recursion in profiles RLS policies
-- The issue is that is_admin() queries profiles table, but profiles table uses is_admin() in RLS policies

-- First, drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles; 
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create a new function that bypasses RLS for admin check
CREATE OR REPLACE FUNCTION public.is_admin_bypass_rls()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'::user_role
  );
$$;

-- Create secure RLS policies that avoid recursion
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a separate admin policy that uses the bypass function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin_bypass_rls());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all profiles using the bypass function
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.is_admin_bypass_rls())
WITH CHECK (public.is_admin_bypass_rls());

-- Fix the Security Definer View issue by dropping and recreating as regular view
DROP VIEW IF EXISTS public.safe_public_profiles CASCADE;

-- Recreate as a regular view (not SECURITY DEFINER) that respects RLS
CREATE VIEW public.safe_public_profiles AS
SELECT 
  user_id,
  first_name,
  last_name,
  avatar_url,
  created_at
FROM public.profiles
WHERE user_id IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.safe_public_profiles TO authenticated;
GRANT SELECT ON public.safe_public_profiles TO anon;

-- Update the existing is_admin function to use a different approach
-- that doesn't cause recursion with profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Use a direct query that bypasses RLS for this specific check
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'::user_role
  );
$$;