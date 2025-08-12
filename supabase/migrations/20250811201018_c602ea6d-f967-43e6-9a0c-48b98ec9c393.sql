-- Secure user_profiles: restrict public access and allow only owner/admin; expose limited public fields via existing function

-- 1) Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2) Revoke any direct table privileges from anon/authenticated (defense-in-depth)
REVOKE ALL PRIVILEGES ON TABLE public.user_profiles FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.user_profiles FROM authenticated;

-- 3) Drop any existing broad SELECT policies on user_profiles
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT polname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND cmd = 'SELECT'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', r.polname);
  END LOOP;
END$$;

-- 4) Create strict policies
-- Owners can view their own full profile
CREATE POLICY "Users can view their own user_profiles"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Owners can insert their own profile (in case it's missing)
CREATE POLICY "Users can insert their own user_profiles"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Owners can update their own profile
CREATE POLICY "Users can update their own user_profiles"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all user_profiles"
ON public.user_profiles
FOR SELECT
USING (public.get_current_user_role() = 'admin');

-- Admins can update all profiles
CREATE POLICY "Admins can update all user_profiles"
ON public.user_profiles
FOR UPDATE
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Admins can delete profiles (optional)
CREATE POLICY "Admins can delete user_profiles"
ON public.user_profiles
FOR DELETE
USING (public.get_current_user_role() = 'admin');

-- 5) Ensure public, authenticated roles can fetch limited fields via function
-- Function already exists per project context: public.get_public_user_profiles()
GRANT EXECUTE ON FUNCTION public.get_public_user_profiles() TO anon, authenticated;
