-- Fix RLS policies for user_behavior_log table
-- Allow users to insert their own behavior logs
CREATE POLICY "users_can_log_behavior"
ON public.user_behavior_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow system to insert behavior logs (for admin functionality)
CREATE POLICY "system_can_log_behavior"
ON public.user_behavior_log
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);