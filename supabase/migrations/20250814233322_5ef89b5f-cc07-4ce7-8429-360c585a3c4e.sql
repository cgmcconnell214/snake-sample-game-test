-- Create account linking and security tracking tables

-- Account linking table to manage multiple OAuth connections per user
CREATE TABLE IF NOT EXISTS public.account_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_id text NOT NULL,
  provider_email text,
  provider_metadata jsonb DEFAULT '{}',
  linked_at timestamp with time zone NOT NULL DEFAULT now(),
  is_primary boolean DEFAULT false,
  UNIQUE(provider, provider_id),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.account_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for account links
CREATE POLICY "Users can view their own account links"
  ON public.account_links
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own account links"
  ON public.account_links
  FOR ALL
  USING (auth.uid() = user_id);

-- Device tracking for security
CREATE TABLE IF NOT EXISTS public.user_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  device_fingerprint text NOT NULL,
  device_name text,
  browser_info jsonb DEFAULT '{}',
  first_seen timestamp with time zone NOT NULL DEFAULT now(),
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  is_trusted boolean DEFAULT false,
  location_data jsonb DEFAULT '{}',
  UNIQUE(user_id, device_fingerprint)
);

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- RLS policies for user devices
CREATE POLICY "Users can view their own devices"
  ON public.user_devices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own devices"
  ON public.user_devices
  FOR ALL
  USING (auth.uid() = user_id);

-- Enhanced security logs
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL,
  ip_address inet,
  user_agent text,
  device_fingerprint text,
  location_data jsonb DEFAULT '{}',
  event_data jsonb DEFAULT '{}',
  risk_score integer DEFAULT 0,
  is_blocked boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for security events
CREATE POLICY "Users can view their own security events"
  ON public.security_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can log security events"
  ON public.security_events
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all security events
CREATE POLICY "Admins can view all security events"
  ON public.security_events
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Function to create device fingerprint from browser data
CREATE OR REPLACE FUNCTION public.register_device(
  p_device_fingerprint text,
  p_device_name text DEFAULT NULL,
  p_browser_info jsonb DEFAULT '{}',
  p_location_data jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  device_id uuid;
BEGIN
  -- Insert or update device record
  INSERT INTO public.user_devices (
    user_id,
    device_fingerprint,
    device_name,
    browser_info,
    location_data,
    last_seen
  )
  VALUES (
    auth.uid(),
    p_device_fingerprint,
    p_device_name,
    p_browser_info,
    p_location_data,
    now()
  )
  ON CONFLICT (user_id, device_fingerprint)
  DO UPDATE SET
    last_seen = now(),
    device_name = COALESCE(EXCLUDED.device_name, user_devices.device_name),
    browser_info = EXCLUDED.browser_info,
    location_data = EXCLUDED.location_data
  RETURNING id INTO device_id;

  -- Log security event
  INSERT INTO public.security_events (
    user_id,
    event_type,
    device_fingerprint,
    event_data
  )
  VALUES (
    auth.uid(),
    'device_registered',
    p_device_fingerprint,
    jsonb_build_object(
      'device_name', p_device_name,
      'browser_info', p_browser_info,
      'location_data', p_location_data
    )
  );

  RETURN device_id;
END;
$$;

-- Function to link OAuth accounts
CREATE OR REPLACE FUNCTION public.link_oauth_account(
  p_provider text,
  p_provider_id text,
  p_provider_email text DEFAULT NULL,
  p_provider_metadata jsonb DEFAULT '{}',
  p_is_primary boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link_id uuid;
  existing_user_id uuid;
BEGIN
  -- Check if this provider account is already linked to another user
  SELECT user_id INTO existing_user_id
  FROM public.account_links
  WHERE provider = p_provider AND provider_id = p_provider_id;

  -- If linked to different user, we have a conflict
  IF existing_user_id IS NOT NULL AND existing_user_id != auth.uid() THEN
    -- Log security event for potential account takeover attempt
    INSERT INTO public.security_events (
      user_id,
      event_type,
      event_data,
      risk_score
    )
    VALUES (
      auth.uid(),
      'account_link_conflict',
      jsonb_build_object(
        'provider', p_provider,
        'existing_user_id', existing_user_id,
        'attempted_user_id', auth.uid()
      ),
      8
    );
    
    RAISE EXCEPTION 'This % account is already linked to another user', p_provider;
  END IF;

  -- Insert or update account link
  INSERT INTO public.account_links (
    user_id,
    provider,
    provider_id,
    provider_email,
    provider_metadata,
    is_primary
  )
  VALUES (
    auth.uid(),
    p_provider,
    p_provider_id,
    p_provider_email,
    p_provider_metadata,
    p_is_primary
  )
  ON CONFLICT (user_id, provider)
  DO UPDATE SET
    provider_id = EXCLUDED.provider_id,
    provider_email = EXCLUDED.provider_email,
    provider_metadata = EXCLUDED.provider_metadata,
    is_primary = EXCLUDED.is_primary,
    linked_at = now()
  RETURNING id INTO link_id;

  -- Log security event
  INSERT INTO public.security_events (
    user_id,
    event_type,
    event_data
  )
  VALUES (
    auth.uid(),
    'oauth_account_linked',
    jsonb_build_object(
      'provider', p_provider,
      'provider_email', p_provider_email,
      'is_primary', p_is_primary
    )
  );

  RETURN link_id;
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_links_user_id ON public.account_links(user_id);
CREATE INDEX IF NOT EXISTS idx_account_links_provider ON public.account_links(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON public.user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_risk_score ON public.security_events(risk_score);