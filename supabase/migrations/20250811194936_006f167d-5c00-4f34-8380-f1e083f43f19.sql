-- Secure user_profiles and expose a safe public view
-- 1) Enable RLS and add least-privilege policies
alter table public.user_profiles enable row level security;

-- Create policies idempotently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can view their own user profile'
  ) THEN
    CREATE POLICY "Users can view their own user profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can insert their own user profile'
  ) THEN
    CREATE POLICY "Users can insert their own user profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can update their own user profile'
  ) THEN
    CREATE POLICY "Users can update their own user profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2) Create a public-safe view exposing only non-sensitive fields
CREATE OR REPLACE VIEW public.public_user_profiles AS
SELECT 
  user_id,
  display_name,
  username,
  bio,
  avatar_url,
  follower_count,
  following_count
FROM public.user_profiles;

COMMENT ON VIEW public.public_user_profiles IS 'Public-safe user profile fields (no phone, email, precise location, or social links).';

-- 3) Allow anon and authenticated to read the safe view only
GRANT SELECT ON public.public_user_profiles TO anon, authenticated;