-- Cleanly reset policies on user_profiles and apply secure set

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Revoke any direct privileges
REVOKE ALL PRIVILEGES ON TABLE public.user_profiles FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.user_profiles FROM authenticated;

-- Drop ALL existing policies on user_profiles
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
  ) LOOP
    EXECUTE format('DROP POLICY %I ON public.user_profiles', r.policyname);
  END LOOP;
END$$;

-- Recreate strict policies
CREATE POLICY "Users can view their own user_profiles"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own user_profiles"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own user_profiles"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user_profiles"
ON public.user_profiles
FOR SELECT
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all user_profiles"
ON public.user_profiles
FOR UPDATE
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete user_profiles"
ON public.user_profiles
FOR DELETE
USING (public.get_current_user_role() = 'admin');

-- Grant execute on limited public access function
GRANT EXECUTE ON FUNCTION public.get_public_user_profiles() TO anon, authenticated;
