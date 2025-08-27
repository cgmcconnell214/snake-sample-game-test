-- CRITICAL SECURITY FIX: Address infinite recursion and KYC data protection

-- Step 1: Fix the infinite recursion by creating a proper role-based system
-- First, create a user roles table to avoid recursive RLS issues
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'compliance_officer', 'user')),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 2: Create secure role checking functions that don't cause recursion
CREATE OR REPLACE FUNCTION public.user_has_role(target_user_id UUID, required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = target_user_id AND role = required_role
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT public.user_has_role(auth.uid(), required_role);
$$;

-- Step 3: Create KYC access control function
CREATE OR REPLACE FUNCTION public.can_access_kyc_data(kyc_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        -- User can access their own KYC data
        auth.uid() = kyc_user_id
        OR 
        -- Compliance officers can access any KYC data
        public.current_user_has_role('compliance_officer')
        OR
        -- Admins can access any KYC data
        public.current_user_has_role('admin');
$$;

-- Step 4: Fix KYC table RLS policies with enhanced security
DROP POLICY IF EXISTS "users_own_kyc" ON public.kyc_verification;

-- Create comprehensive KYC policies
CREATE POLICY "kyc_read_access" 
ON public.kyc_verification 
FOR SELECT 
USING (public.can_access_kyc_data(user_id));

CREATE POLICY "kyc_user_insert" 
ON public.kyc_verification 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kyc_compliance_update" 
ON public.kyc_verification 
FOR UPDATE 
USING (
    public.current_user_has_role('compliance_officer') 
    OR public.current_user_has_role('admin')
    OR auth.uid() = user_id
);

CREATE POLICY "kyc_admin_delete" 
ON public.kyc_verification 
FOR DELETE 
USING (
    public.current_user_has_role('admin')
);

-- Step 5: Set up user_roles policies
CREATE POLICY "users_can_view_own_roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "admins_can_manage_roles" 
ON public.user_roles 
FOR ALL 
USING (public.current_user_has_role('admin'))
WITH CHECK (public.current_user_has_role('admin'));

-- Step 6: Add security event logging for KYC access
CREATE OR REPLACE FUNCTION public.log_kyc_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log KYC data access attempts
    INSERT INTO public.security_events (
        user_id,
        event_type,
        event_data,
        risk_score
    ) VALUES (
        auth.uid(),
        'kyc_data_access',
        jsonb_build_object(
            'target_user_id', COALESCE(NEW.user_id, OLD.user_id),
            'operation', TG_OP,
            'table_name', TG_TABLE_NAME,
            'timestamp', now()
        ),
        CASE 
            WHEN auth.uid() = COALESCE(NEW.user_id, OLD.user_id) THEN 2  -- Own data access
            ELSE 5  -- Compliance/admin access to other's data
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add trigger for KYC access logging
DROP TRIGGER IF EXISTS kyc_access_log_trigger ON public.kyc_verification;
CREATE TRIGGER kyc_access_log_trigger
    AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.kyc_verification
    FOR EACH ROW EXECUTE FUNCTION public.log_kyc_access();

-- Step 7: Create admin assignment function for initial setup
CREATE OR REPLACE FUNCTION public.assign_admin_role(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (target_user_id, 'admin', auth.uid())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN TRUE;
END;
$$;