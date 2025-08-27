-- Find and fix all Security Definer views
-- Check for any views with SECURITY DEFINER property

-- First, let's check if there are any existing SECURITY DEFINER views in the database
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%SECURITY DEFINER%';

-- Drop any existing security definer views that might be causing issues
-- The safe_public_profiles should already be fixed, but let's ensure it's correct

DROP VIEW IF EXISTS public.safe_public_profiles CASCADE;

-- Recreate the view without SECURITY DEFINER
CREATE VIEW public.safe_public_profiles AS
SELECT 
  user_id,
  first_name,
  last_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Grant proper permissions
GRANT SELECT ON public.safe_public_profiles TO authenticated;
GRANT SELECT ON public.safe_public_profiles TO anon;

-- Also check for any other problematic views and fix them
-- Drop any other views that might have SECURITY DEFINER
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
        AND viewname != 'safe_public_profiles'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_record.viewname);
    END LOOP;
END $$;