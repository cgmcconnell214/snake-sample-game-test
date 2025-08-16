-- Create user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user', 'premium', 'compliance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure profiles table has role column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Create function to set admin role by email
CREATE OR REPLACE FUNCTION public.set_admin_role_by_email(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Set admin role for the specific email
SELECT public.set_admin_role_by_email('cgmcconnell214@gmail.com');

-- Create function to check user roles (for RLS policies)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE user_id = auth.uid();
  RETURN user_role;
END;
$$;