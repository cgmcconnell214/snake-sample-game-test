-- Add encrypted two factor secret to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS two_factor_secret_encrypted text;

-- Create user_mfa table for storing 2FA data securely if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_mfa') THEN
    CREATE TABLE public.user_mfa (
      id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
      totp_secret_encrypted text NOT NULL,
      backup_codes_encrypted text[] DEFAULT '{}',
      enabled boolean NOT NULL DEFAULT false,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    );

    -- Enable RLS on user_mfa
    ALTER TABLE public.user_mfa ENABLE ROW LEVEL SECURITY;

    -- Create policies for user_mfa
    CREATE POLICY "Users can manage their own MFA data" 
    ON public.user_mfa 
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;