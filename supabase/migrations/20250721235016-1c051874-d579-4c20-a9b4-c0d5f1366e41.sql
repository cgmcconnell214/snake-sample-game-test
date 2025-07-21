-- First, let's check what enum values exist for user_role
SELECT unnest(enum_range(NULL::user_role));

-- Add 'compliance' to the user_role enum if it doesn't exist
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'compliance';

-- Now update user to admin role and enterprise subscription
UPDATE public.profiles 
SET 
  role = 'admin',
  subscription_tier = 'enterprise',
  updated_at = now()
WHERE email = 'cgmcconnell214@gmail.com';

-- Create enterprise subscription record
INSERT INTO public.subscriptions (
  user_id,
  tier,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
) VALUES (
  (SELECT user_id FROM profiles WHERE email = 'cgmcconnell214@gmail.com'),
  'enterprise',
  'active',
  now(),
  now() + interval '1 year',
  false,
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  tier = 'enterprise',
  status = 'active',
  current_period_start = now(),
  current_period_end = now() + interval '1 year',
  updated_at = now();