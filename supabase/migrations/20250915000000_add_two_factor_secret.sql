-- Add two_factor_secret column to profiles for storing MFA secrets
ALTER TABLE public.profiles
ADD COLUMN two_factor_secret TEXT;
