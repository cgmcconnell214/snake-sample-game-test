-- Add secure verification code functionality to user_certifications
ALTER TABLE user_certifications 
ADD COLUMN IF NOT EXISTS verification_code_hash TEXT,
ADD COLUMN IF NOT EXISTS code_display_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_displayed_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient lookup by hash
CREATE INDEX IF NOT EXISTS idx_user_certifications_code_hash 
ON user_certifications (verification_code_hash);

-- Create function to generate cryptographically secure verification codes
CREATE OR REPLACE FUNCTION generate_secure_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_prefix TEXT := 'CERT';
  timestamp_part TEXT;
  random_part TEXT;
  full_code TEXT;
BEGIN
  -- Generate timestamp part (YYYYMMDDHHMISS)
  timestamp_part := to_char(now(), 'YYYYMMDDHHMISS');
  
  -- Generate cryptographically secure random part (12 characters)
  random_part := upper(encode(gen_random_bytes(9), 'base64'));
  -- Remove problematic characters and ensure exactly 12 chars
  random_part := regexp_replace(random_part, '[^A-Z0-9]', '', 'g');
  random_part := substring(random_part, 1, 12);
  
  -- If random part is too short, pad with more random bytes
  WHILE length(random_part) < 12 LOOP
    random_part := random_part || upper(encode(gen_random_bytes(3), 'base64'));
    random_part := regexp_replace(random_part, '[^A-Z0-9]', '', 'g');
  END LOOP;
  
  random_part := substring(random_part, 1, 12);
  
  -- Combine parts: CERT-YYYYMMDDHHMISS-XXXXXXXXXXXX
  full_code := code_prefix || '-' || timestamp_part || '-' || random_part;
  
  RETURN full_code;
END;
$$;

-- Create function to hash verification codes securely
CREATE OR REPLACE FUNCTION hash_verification_code(code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use SHA-256 with a salt for secure hashing
  RETURN encode(
    digest(
      code || (SELECT current_setting('app.verification_salt', true)), 
      'sha256'
    ), 
    'hex'
  );
END;
$$;

-- Create function to verify codes without exposing plaintext
CREATE OR REPLACE FUNCTION verify_certification_code(
  p_code TEXT,
  p_user_id UUID DEFAULT NULL
) RETURNS TABLE(
  is_valid BOOLEAN,
  certification_name TEXT,
  user_name TEXT,
  earned_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  code_hash TEXT;
BEGIN
  -- Hash the provided code
  code_hash := hash_verification_code(p_code);
  
  -- Look up by hash
  RETURN QUERY
  SELECT 
    TRUE as is_valid,
    c.name as certification_name,
    COALESCE(p.first_name || ' ' || p.last_name, 'Certified User') as user_name,
    uc.earned_at,
    uc.expires_at
  FROM user_certifications uc
  JOIN certifications c ON c.id = uc.certification_id
  LEFT JOIN profiles p ON p.user_id = uc.user_id
  WHERE uc.verification_code_hash = code_hash
    AND (p_user_id IS NULL OR uc.user_id = p_user_id);
  
  -- If no rows returned, return invalid result
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE, NULL::TIMESTAMP WITH TIME ZONE;
  END IF;
END;
$$;

-- Set the verification salt (should be set via environment in production)
SELECT set_config('app.verification_salt', 'changeme_in_production', false);