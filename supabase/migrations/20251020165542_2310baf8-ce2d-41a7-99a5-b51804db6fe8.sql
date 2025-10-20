-- Fix warning-level security issues

-- 1. Fix rate_limits RLS: Remove overly permissive policy and create admin-only view policy
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can manage their own rate limits" ON public.rate_limits;

CREATE POLICY "admins_view_rate_limits"
ON public.rate_limits FOR SELECT
USING (public.current_user_has_role('admin'));

-- Note: Edge functions using service role will bypass RLS entirely for write operations

-- 2. Fix security_events RLS: Ensure only admins and the event owner can view security events
DROP POLICY IF EXISTS "Users see own logs, admins see all" ON public.security_events;

CREATE POLICY "users_view_own_security_events"
ON public.security_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "admins_view_all_security_events"
ON public.security_events FOR SELECT
USING (public.current_user_has_role('admin'));

-- 3. Add search_path to security definer functions that are missing it
-- Update cleanup_expired_sessions function
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up expired rate limits
  DELETE FROM public.rate_limits 
  WHERE expires_at < now();
  
  -- Clean up old security events (keep last 30 days)
  DELETE FROM public.security_events 
  WHERE created_at < now() - INTERVAL '30 days'
    AND risk_score < 5;
  
  -- Clean up expired meeting tokens
  DELETE FROM public.meeting_access_tokens 
  WHERE expires_at < now();
  
  -- Log cleanup activity
  INSERT INTO public.security_events (
    event_type,
    event_data,
    risk_score
  ) VALUES (
    'system_cleanup',
    jsonb_build_object(
      'cleanup_timestamp', now(),
      'automated_cleanup', true
    ),
    1
  );
END;
$$;

-- Update log_admin_action function
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    event_data,
    risk_score
  ) VALUES (
    auth.uid(),
    'admin_action',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', COALESCE(NEW.id, OLD.id),
      'timestamp', now()
    ),
    3
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update log_kyc_access function
CREATE OR REPLACE FUNCTION public.log_kyc_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    event_data,
    risk_score
  ) VALUES (
    auth.uid(),
    'kyc_data_access',
    jsonb_build_object(
      'target_user_id', COALESCE(NEW.user_id, OLD.user_id),
      'operation', TG_OP,
      'table_name', TG_TABLE_NAME,
      'timestamp', now()
    ),
    CASE 
      WHEN auth.uid() = COALESCE(NEW.user_id, OLD.user_id) THEN 2
      ELSE 5
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update assign_admin_role function
CREATE OR REPLACE FUNCTION public.assign_admin_role(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, 'admin', auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Update register_device function
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

-- Update link_oauth_account function
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
  SELECT user_id INTO existing_user_id
  FROM public.account_links
  WHERE provider = p_provider AND provider_id = p_provider_id;

  IF existing_user_id IS NOT NULL AND existing_user_id != auth.uid() THEN
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

-- Update ensure_user_profile_privacy function
CREATE OR REPLACE FUNCTION public.ensure_user_profile_privacy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.privacy_settings IS NULL THEN
    NEW.privacy_settings := jsonb_build_object(
      'profile_visibility', 'private',
      'phone_visibility', 'private',
      'location_visibility', 'private', 
      'website_visibility', 'public',
      'social_links_visibility', 'public',
      'bio_visibility', 'public'
    );
  END IF;
  
  IF NEW.is_public IS NULL THEN
    NEW.is_public := false;
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.phone IS DISTINCT FROM NEW.phone THEN
    INSERT INTO public.security_events (
      user_id,
      event_type,
      event_data,
      risk_score
    ) VALUES (
      NEW.user_id,
      'profile_phone_update',
      jsonb_build_object('old_phone_set', OLD.phone IS NOT NULL, 'new_phone_set', NEW.phone IS NOT NULL),
      3
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update log_profile_security_events function
CREATE OR REPLACE FUNCTION public.log_profile_security_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      INSERT INTO public.security_events (
        user_id,
        event_type,
        event_data,
        risk_score
      ) VALUES (
        auth.uid(),
        'profile_email_change',
        jsonb_build_object(
          'old_email_set', OLD.email IS NOT NULL,
          'new_email_set', NEW.email IS NOT NULL,
          'timestamp', now()
        ),
        3
      );
    END IF;
    
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      INSERT INTO public.security_events (
        user_id,
        event_type,
        event_data,
        risk_score
      ) VALUES (
        auth.uid(),
        'profile_role_change',
        jsonb_build_object(
          'old_role', OLD.role,
          'new_role', NEW.role,
          'timestamp', now()
        ),
        8
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;