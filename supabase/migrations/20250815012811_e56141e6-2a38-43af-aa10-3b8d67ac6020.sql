-- Add meeting credentials table for secure storage
CREATE TABLE IF NOT EXISTS public.meeting_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('zoom', 'teams')),
  meeting_url text NOT NULL,
  meeting_id text NOT NULL,
  host_key text,
  participant_key text,
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on meeting credentials
ALTER TABLE public.meeting_credentials ENABLE ROW LEVEL SECURITY;

-- Only class hosts can manage their meeting credentials
CREATE POLICY "Class hosts can manage their meeting credentials"
ON public.meeting_credentials
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM live_classes 
    WHERE live_classes.id = meeting_credentials.class_id 
    AND live_classes.host_id = auth.uid()
  )
);

-- Add signed URL table for secure meeting access
CREATE TABLE IF NOT EXISTS public.meeting_access_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  attendee_id uuid NOT NULL,
  access_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on access tokens
ALTER TABLE public.meeting_access_tokens ENABLE ROW LEVEL SECURITY;

-- Attendees can only access their own tokens
CREATE POLICY "Attendees can access their own meeting tokens"
ON public.meeting_access_tokens
FOR SELECT
USING (auth.uid() = attendee_id);

-- System can create and update tokens
CREATE POLICY "System can manage meeting tokens"
ON public.meeting_access_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to generate secure meeting access token
CREATE OR REPLACE FUNCTION public.generate_meeting_access_token(
  p_class_id uuid,
  p_attendee_id uuid,
  p_expires_minutes integer DEFAULT 120
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  access_token text;
BEGIN
  -- Generate a secure random token
  access_token := encode(gen_random_bytes(32), 'base64');
  
  -- Insert the token
  INSERT INTO meeting_access_tokens (
    class_id,
    attendee_id,
    access_token,
    expires_at
  ) VALUES (
    p_class_id,
    p_attendee_id,
    access_token,
    now() + (p_expires_minutes || ' minutes')::interval
  );
  
  RETURN access_token;
END;
$$;

-- Function to validate and consume meeting access token
CREATE OR REPLACE FUNCTION public.validate_meeting_access_token(
  p_token text
) RETURNS TABLE(
  class_id uuid,
  attendee_id uuid,
  meeting_url text,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mat.class_id,
    mat.attendee_id,
    mc.meeting_url,
    (mat.expires_at > now() AND NOT mat.is_used AND mc.is_active) as is_valid
  FROM meeting_access_tokens mat
  JOIN meeting_credentials mc ON mc.class_id = mat.class_id
  WHERE mat.access_token = p_token;
  
  -- Mark token as used if valid
  UPDATE meeting_access_tokens 
  SET is_used = true 
  WHERE access_token = p_token 
    AND expires_at > now() 
    AND NOT is_used;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_meeting_credentials_updated_at
  BEFORE UPDATE ON meeting_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();