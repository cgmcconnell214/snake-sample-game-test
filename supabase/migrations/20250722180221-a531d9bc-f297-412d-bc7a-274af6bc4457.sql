-- Fix XRPL table RLS policies (complete the previous incomplete migration)
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