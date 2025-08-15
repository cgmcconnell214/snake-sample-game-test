-- Create application logs table for centralized logging
CREATE TABLE public.application_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  message text NOT NULL,
  context jsonb DEFAULT '{}',
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  error_data jsonb,
  user_id uuid,
  session_id text,
  request_id text,
  component text,
  function_name text,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_application_logs_level ON public.application_logs(level);
CREATE INDEX idx_application_logs_user_id ON public.application_logs(user_id);
CREATE INDEX idx_application_logs_timestamp ON public.application_logs(timestamp);
CREATE INDEX idx_application_logs_function_name ON public.application_logs(function_name);
CREATE INDEX idx_application_logs_session_id ON public.application_logs(session_id);

-- Enable Row Level Security
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application logs
CREATE POLICY "Admins can view all logs" 
ON public.application_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "System can insert logs" 
ON public.application_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own logs" 
ON public.application_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add missing kyc_submitted_at column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'kyc_submitted_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN kyc_submitted_at timestamp with time zone;
  END IF;
END $$;