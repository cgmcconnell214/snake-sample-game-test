-- Fix critical missing database structures and policies

-- Create missing tables that are referenced in the application

-- 1. User Profiles table enhancement (if not properly structured)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  location TEXT,
  phone TEXT,
  social_links JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. User Posts table
CREATE TABLE IF NOT EXISTS public.user_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  post_type TEXT DEFAULT 'text',
  is_public BOOLEAN DEFAULT true,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. User Messages table
CREATE TABLE IF NOT EXISTS public.user_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users NOT NULL,
  recipient_id UUID REFERENCES auth.users NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'direct',
  is_read BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. User Behavior Log table
CREATE TABLE IF NOT EXISTS public.user_behavior_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. User Certifications table
CREATE TABLE IF NOT EXISTS public.user_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  certification_id UUID REFERENCES public.certifications NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  verification_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. User Follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users NOT NULL,
  following_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- 7. Tokenized Assets table  
CREATE TABLE IF NOT EXISTS public.tokenized_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users NOT NULL,
  asset_name TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  description TEXT,
  total_supply NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  xrpl_currency_code TEXT,
  xrpl_transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Tokenization Events table
CREATE TABLE IF NOT EXISTS public.tokenization_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.tokenized_assets NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Workflow Automation Rules table
CREATE TABLE IF NOT EXISTS public.workflow_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokenized_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokenization_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_automation_rules ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- User Profiles policies
CREATE POLICY "Users can view public profiles" ON public.user_profiles FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage their own profile" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);

-- User Posts policies
CREATE POLICY "Users can view public posts" ON public.user_posts FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage their own posts" ON public.user_posts FOR ALL USING (auth.uid() = user_id);

-- User Messages policies  
CREATE POLICY "Users can view their own messages" ON public.user_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send messages" ON public.user_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own messages" ON public.user_messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- User Behavior Log policies
CREATE POLICY "Users can view their own behavior log" ON public.user_behavior_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert behavior logs" ON public.user_behavior_log FOR INSERT WITH CHECK (true);

-- User Certifications policies
CREATE POLICY "Users can view their own certifications" ON public.user_certifications FOR ALL USING (auth.uid() = user_id);

-- User Follows policies
CREATE POLICY "Users can view all follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follows" ON public.user_follows FOR ALL USING (auth.uid() = follower_id);

-- Tokenized Assets policies
CREATE POLICY "Users can view active tokenized assets" ON public.tokenized_assets FOR SELECT USING (true);
CREATE POLICY "Users can manage their own assets" ON public.tokenized_assets FOR ALL USING (auth.uid() = creator_id);

-- Tokenization Events policies  
CREATE POLICY "Users can view tokenization events for their assets" ON public.tokenization_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tokenized_assets WHERE id = asset_id AND creator_id = auth.uid())
);
CREATE POLICY "System can insert tokenization events" ON public.tokenization_events FOR INSERT WITH CHECK (true);

-- Workflow Automation Rules policies
CREATE POLICY "Users can manage their own automation rules" ON public.workflow_automation_rules FOR ALL USING (auth.uid() = user_id);