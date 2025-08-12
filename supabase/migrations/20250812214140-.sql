-- Make public view run with invoker privileges and grant explicit read rights
ALTER VIEW public.public_user_profiles SET (security_invoker = true);

GRANT SELECT ON public.public_user_profiles TO anon;
GRANT SELECT ON public.public_user_profiles TO authenticated;