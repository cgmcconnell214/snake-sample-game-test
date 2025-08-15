-- Create API keys table for secure key management
CREATE TABLE public.agent_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL, -- Store first 8 chars for identification
  name text,
  is_active boolean DEFAULT true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  revoked_at timestamp with time zone,
  revoked_by uuid
);

-- Create indexes
CREATE INDEX idx_agent_api_keys_agent_id ON public.agent_api_keys(agent_id);
CREATE INDEX idx_agent_api_keys_hash ON public.agent_api_keys(key_hash);
CREATE INDEX idx_agent_api_keys_active ON public.agent_api_keys(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their agent API keys"
ON public.agent_api_keys
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM ai_agents 
    WHERE ai_agents.id = agent_api_keys.agent_id 
    AND ai_agents.creator_id = auth.uid()
  )
);

-- Create secure key hashing function
CREATE OR REPLACE FUNCTION public.hash_api_key(key_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pgcrypto extension for secure hashing
  RETURN crypt(key_text, gen_salt('bf', 12));
END;
$$;

-- Create function to verify API key
CREATE OR REPLACE FUNCTION public.verify_api_key(key_text text, key_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN crypt(key_text, key_hash) = key_hash;
END;
$$;

-- Create function to generate and store API key
CREATE OR REPLACE FUNCTION public.create_agent_api_key(
  p_agent_id uuid,
  p_key_text text,
  p_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_key_id uuid;
  key_prefix text;
BEGIN
  -- Extract first 8 characters for display
  key_prefix := substring(p_key_text, 1, 8);
  
  -- Insert new API key record
  INSERT INTO public.agent_api_keys (
    agent_id,
    key_hash,
    key_prefix,
    name,
    created_by
  ) VALUES (
    p_agent_id,
    public.hash_api_key(p_key_text),
    key_prefix,
    p_name,
    auth.uid()
  ) RETURNING id INTO new_key_id;
  
  RETURN new_key_id;
END;
$$;

-- Create function to revoke API key
CREATE OR REPLACE FUNCTION public.revoke_agent_api_key(p_key_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.agent_api_keys 
  SET 
    is_active = false,
    revoked_at = now(),
    revoked_by = auth.uid()
  WHERE id = p_key_id
  AND EXISTS (
    SELECT 1 FROM ai_agents 
    WHERE ai_agents.id = agent_api_keys.agent_id 
    AND ai_agents.creator_id = auth.uid()
  );
  
  RETURN FOUND;
END;
$$;

-- Create function to update last used timestamp
CREATE OR REPLACE FUNCTION public.update_api_key_usage(p_key_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.agent_api_keys 
  SET last_used_at = now()
  WHERE key_hash = p_key_hash 
  AND is_active = true;
END;
$$;