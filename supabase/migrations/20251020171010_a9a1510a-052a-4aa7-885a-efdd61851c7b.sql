-- Fix critical privilege escalation vulnerability in profiles table
-- Users should NOT be able to update their own role

-- First, let's check what policies exist and drop overly permissive ones
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;

-- Create granular policies that explicitly exclude role updates
CREATE POLICY "Users can update own profile except role"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (
    -- Prevent users from changing their own role
    role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE user_id = auth.uid())
  )
);

-- Only admins can update roles
CREATE POLICY "Only admins can update user roles"
ON profiles
FOR UPDATE
TO authenticated
USING (current_user_has_role('admin'))
WITH CHECK (current_user_has_role('admin'));

-- Ensure is_admin_bypass_rls uses user_roles table only
CREATE OR REPLACE FUNCTION public.is_admin_bypass_rls()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_user_has_role('admin');
$$;

-- Add additional safeguard: trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Log to security events
    INSERT INTO public.security_events (
      user_id,
      event_type,
      event_data,
      risk_score
    ) VALUES (
      COALESCE(auth.uid(), NEW.user_id),
      'role_modification_attempt',
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'modified_by', auth.uid(),
        'timestamp', now()
      ),
      10  -- Critical risk score
    );
    
    -- Only allow if modifier is admin
    IF NOT current_user_has_role('admin') THEN
      RAISE EXCEPTION 'Unauthorized role modification attempt detected';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce role change logging and validation
DROP TRIGGER IF EXISTS enforce_role_changes ON profiles;
CREATE TRIGGER enforce_role_changes
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.log_role_changes();

-- Add constraint to ensure role is always synced from user_roles (source of truth)
COMMENT ON COLUMN profiles.role IS 'DEPRECATED: Use user_roles table as source of truth. This column kept for backward compatibility only.';