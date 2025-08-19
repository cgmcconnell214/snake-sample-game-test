-- Phase 1: Critical Database Security Fixes (Corrected)

-- 1. Fix RLS Policy Infinite Recursion by creating security definer functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE user_id = auth.uid();
  RETURN user_role;
END;
$$;

-- 2. Create secure function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'::user_role
  );
END;
$$;

-- 3. Drop problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Admin can view all kingdom entries" ON public.kingdom_entry_records;
DROP POLICY IF EXISTS "Admin can manage sacred law principles" ON public.sacred_law_principles;
DROP POLICY IF EXISTS "Admins can view all security events" ON public.security_events;
DROP POLICY IF EXISTS "Admins can manage network nodes" ON public.network_nodes;
DROP POLICY IF EXISTS "Admins can manage market data" ON public.market_data;
DROP POLICY IF EXISTS "admin_regulatory_reports" ON public.regulatory_reports;
DROP POLICY IF EXISTS "compliance_access" ON public.compliance_monitoring;
DROP POLICY IF EXISTS "admin_all_transactions" ON public.blockchain_transaction_queue;
DROP POLICY IF EXISTS "Admins manage sync events" ON public.sync_events;
DROP POLICY IF EXISTS "Admins manage XRPL" ON public."XRPL";
DROP POLICY IF EXISTS "Admins can view all logs" ON public.application_logs;

-- 4. Create new secure RLS policies using security definer functions
CREATE POLICY "Admin can view all kingdom entries" 
ON public.kingdom_entry_records 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admin can manage sacred law principles" 
ON public.sacred_law_principles 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all security events" 
ON public.security_events 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can manage network nodes" 
ON public.network_nodes 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage market data" 
ON public.market_data 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "admin_regulatory_reports" 
ON public.regulatory_reports 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "compliance_access" 
ON public.compliance_monitoring 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "admin_all_transactions" 
ON public.blockchain_transaction_queue 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage sync events" 
ON public.sync_events 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage XRPL" 
ON public."XRPL" 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all logs" 
ON public.application_logs 
FOR SELECT 
USING (public.is_admin());

-- 5. Ensure profiles table has proper privacy protection
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 6. Harden all database functions with proper search paths
CREATE OR REPLACE FUNCTION public.set_admin_role_by_email(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find user by email in auth.users
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update or insert profile with admin role
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (target_user_id, target_email, 'admin'::user_role)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin'::user_role;
  
  RETURN true;
END;
$$;

-- 7. Update other critical functions with hardened search paths
CREATE OR REPLACE FUNCTION public.get_public_user_profiles()
RETURNS TABLE(user_id uuid, display_name text, username text, bio text, avatar_url text)
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
    up.avatar_url
  FROM public.user_profiles up 
  WHERE up.is_public = true 
     OR (up.privacy_settings->>'profile_visibility') = 'public';
END;
$$;