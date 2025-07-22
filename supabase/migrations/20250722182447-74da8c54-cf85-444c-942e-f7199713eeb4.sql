-- Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create trigger to sync avatar between profiles and user_profiles
CREATE OR REPLACE FUNCTION public.sync_profile_avatar()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND NEW.avatar_url IS NOT NULL THEN
    -- Sync from profiles to user_profiles
    UPDATE public.user_profiles
    SET avatar_url = NEW.avatar_url
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for avatar sync from profiles to user_profiles
DROP TRIGGER IF EXISTS sync_avatar_from_profiles ON public.profiles;
CREATE TRIGGER sync_avatar_from_profiles
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_avatar();

-- Create function to sync from user_profiles to profiles
CREATE OR REPLACE FUNCTION public.sync_user_profile_avatar()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND NEW.avatar_url IS NOT NULL THEN
    -- Sync from user_profiles to profiles
    UPDATE public.profiles
    SET avatar_url = NEW.avatar_url
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for avatar sync from user_profiles to profiles
DROP TRIGGER IF EXISTS sync_avatar_from_user_profiles ON public.user_profiles;
CREATE TRIGGER sync_avatar_from_user_profiles
AFTER UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile_avatar();