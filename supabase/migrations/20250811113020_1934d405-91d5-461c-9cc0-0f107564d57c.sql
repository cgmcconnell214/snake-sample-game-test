-- Pin search_path to 'public' for security (Supabase Linter: function_search_path_mutable)
-- This uses ALTER FUNCTION so we don't need to redefine functions

-- Avatar sync triggers
ALTER FUNCTION public.sync_profile_avatar() SET search_path = 'public';
ALTER FUNCTION public.sync_user_profile_avatar() SET search_path = 'public';

-- Social counts triggers
ALTER FUNCTION public.update_follow_counts() SET search_path = 'public';
ALTER FUNCTION public.update_post_counts() SET search_path = 'public';

-- Notifications
ALTER FUNCTION public.create_notification(uuid, text, text, text, jsonb) SET search_path = 'public';
ALTER FUNCTION public.create_like_notification() SET search_path = 'public';
ALTER FUNCTION public.create_follow_notification() SET search_path = 'public';
ALTER FUNCTION public.create_comment_notification() SET search_path = 'public';
ALTER FUNCTION public.get_user_notifications(uuid) SET search_path = 'public';
ALTER FUNCTION public.mark_notification_read(uuid) SET search_path = 'public';
ALTER FUNCTION public.mark_all_notifications_read(uuid) SET search_path = 'public';

-- AI agents
ALTER FUNCTION public.execute_ai_agent_workflow(uuid, jsonb, jsonb) SET search_path = 'public';
ALTER FUNCTION public.cleanup_stuck_executions() SET search_path = 'public';

-- Market data
ALTER FUNCTION public.update_market_data_timestamp() SET search_path = 'public';
