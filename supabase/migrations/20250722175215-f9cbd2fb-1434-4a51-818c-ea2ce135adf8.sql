-- Fix XRPL table RLS policies
-- This table currently has RLS enabled but no policies, which blocks all access

-- Create RLS policies for XRPL table
CREATE POLICY "Admin access to XRPL table" 
ON public.XRPL 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Service role access to XRPL table"
ON public.XRPL
FOR ALL
USING (auth.role() = 'service_role');