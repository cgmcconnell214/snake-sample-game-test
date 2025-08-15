-- Modify subscriptions table to enforce stripe_customer_id NOT NULL constraint
-- First, update any existing NULL values to empty string temporarily
UPDATE subscriptions 
SET stripe_customer_id = 'temp_' || gen_random_uuid()::text 
WHERE stripe_customer_id IS NULL AND status = 'active';

-- Delete any inactive records with NULL stripe_customer_id as these are invalid
DELETE FROM subscriptions 
WHERE stripe_customer_id IS NULL AND status = 'inactive';

-- Now add the NOT NULL constraint
ALTER TABLE subscriptions 
ALTER COLUMN stripe_customer_id SET NOT NULL;

-- Add a unique constraint on user_id and stripe_customer_id combination for data integrity
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_stripe 
ON subscriptions (user_id, stripe_customer_id);

-- Create function to get subscription by user_id
CREATE OR REPLACE FUNCTION public.get_user_subscription_with_stripe_customer(
  p_user_id uuid
) RETURNS TABLE(
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  tier text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.status,
    s.tier,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end
  FROM subscriptions s
  WHERE s.user_id = p_user_id;
END;
$$;