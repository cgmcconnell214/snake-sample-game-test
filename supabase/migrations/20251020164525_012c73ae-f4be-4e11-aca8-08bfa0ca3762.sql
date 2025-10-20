-- Fix critical security issues: Enable RLS on user_profiles and restrict access to profiles table

-- 1. Enable RLS on user_profiles table (currently has NO protection)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for user_profiles to protect phone numbers, locations, social links
CREATE POLICY "users_view_public_or_own"
ON user_profiles FOR SELECT
USING (
  is_public = true 
  OR auth.uid() = user_id 
  OR public.current_user_has_role('admin')
);

CREATE POLICY "users_update_own"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_insert_own"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own"
ON user_profiles FOR DELETE
USING (auth.uid() = user_id);

-- 3. Drop overly permissive public read policy on profiles table if it exists
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- 4. Create restrictive policies for profiles table to protect emails and personal data
CREATE POLICY "users_view_own_profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "admins_view_all_profiles"
ON profiles FOR SELECT
USING (public.current_user_has_role('admin'));

CREATE POLICY "users_update_own_profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_insert_own_profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);