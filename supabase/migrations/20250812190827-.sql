-- Ensure RLS is enabled and apply owner-only and admin policies on user_profiles
-- Note: Service role (used by edge functions) bypasses RLS automatically

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Owner-only policy (manage own rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_profiles' 
      AND policyname = 'users_manage_own_user_profiles'
  ) THEN
    CREATE POLICY "users_manage_own_user_profiles"
      ON public.user_profiles
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Admin full access policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_profiles' 
      AND policyname = 'admin_full_access_user_profiles'
  ) THEN
    CREATE POLICY "admin_full_access_user_profiles"
      ON public.user_profiles
      FOR ALL
      USING (public.get_current_user_role() = 'admin')
      WITH CHECK (public.get_current_user_role() = 'admin');
  END IF;
END
$$;