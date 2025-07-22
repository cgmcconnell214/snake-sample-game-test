-- Fix infinite recursion in profiles RLS policies by creating a security definer function
-- First, create a function to safely get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE user_id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Drop the problematic policy and recreate it
DROP POLICY IF EXISTS "admin_full_access" ON public.profiles;

-- Create new admin policy using the security definer function
CREATE POLICY "admin_full_access" ON public.profiles
FOR ALL 
USING (public.get_current_user_role() = 'admin');

-- Create user profiles table for social media-like functionality
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create posts table for social media functionality
CREATE TABLE public.user_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[],
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'video', 'link')),
  is_public BOOLEAN DEFAULT true,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_posts
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_posts
CREATE POLICY "Public posts are viewable by everyone" ON public.user_posts
FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own posts" ON public.user_posts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own posts" ON public.user_posts
FOR ALL USING (auth.uid() = user_id);

-- Create message center table for in-app messaging
CREATE TABLE public.user_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'user' CHECK (message_type IN ('user', 'system', 'report', 'compliance')),
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  parent_message_id UUID REFERENCES public.user_messages(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_messages
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_messages
CREATE POLICY "Users can view their own messages" ON public.user_messages
FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY "Users can send messages" ON public.user_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON public.user_messages
FOR UPDATE USING (auth.uid() = recipient_id);

-- Create IP tokenization table
CREATE TABLE public.ip_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  ip_type TEXT NOT NULL CHECK (ip_type IN ('patent', 'trademark', 'copyright', 'trade_secret', 'other')),
  annual_revenue NUMERIC(15,2) DEFAULT 0,
  valuation NUMERIC(15,2),
  total_tokens BIGINT NOT NULL,
  tokens_per_dollar NUMERIC(10,8) DEFAULT 2.0, -- Default 2 tokens per dollar based on example
  annual_yield_percentage NUMERIC(5,4) DEFAULT 0.0050, -- 0.50% as decimal
  staking_enabled BOOLEAN DEFAULT true,
  min_stake_period_days INTEGER DEFAULT 365,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  legal_documents JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on ip_assets
ALTER TABLE public.ip_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ip_assets
CREATE POLICY "Public IP assets are viewable by everyone" ON public.ip_assets
FOR SELECT USING (is_active = true);

CREATE POLICY "Creators can manage their IP assets" ON public.ip_assets
FOR ALL USING (auth.uid() = creator_id);

-- Create IP token holdings for staking
CREATE TABLE public.ip_token_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_asset_id UUID NOT NULL REFERENCES public.ip_assets(id) ON DELETE CASCADE,
  holder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_held BIGINT NOT NULL DEFAULT 0,
  tokens_staked BIGINT DEFAULT 0,
  stake_start_date TIMESTAMPTZ,
  stake_end_date TIMESTAMPTZ,
  accumulated_rewards NUMERIC(15,8) DEFAULT 0,
  last_reward_calculation TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ip_asset_id, holder_id)
);

-- Enable RLS on ip_token_holdings
ALTER TABLE public.ip_token_holdings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ip_token_holdings
CREATE POLICY "Users can view their own IP token holdings" ON public.ip_token_holdings
FOR SELECT USING (auth.uid() = holder_id);

CREATE POLICY "Users can manage their own IP token holdings" ON public.ip_token_holdings
FOR ALL USING (auth.uid() = holder_id);

-- Fix database function search paths
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Also create user profile entry
  INSERT INTO public.user_profiles (user_id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    LOWER(COALESCE(NEW.raw_user_meta_data->>'first_name', '') || '.' || COALESCE(NEW.raw_user_meta_data->>'last_name', '') || '.' || substring(NEW.id::text from 1 for 8))
  );
  
  RETURN NEW;
END;
$function$;

-- Update the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_posts_updated_at
BEFORE UPDATE ON public.user_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_messages_updated_at
BEFORE UPDATE ON public.user_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ip_assets_updated_at
BEFORE UPDATE ON public.ip_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ip_token_holdings_updated_at
BEFORE UPDATE ON public.ip_token_holdings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();