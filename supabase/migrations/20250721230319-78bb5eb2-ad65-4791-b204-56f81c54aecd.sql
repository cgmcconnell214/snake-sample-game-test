-- XRPL Exchange Platform - Complete Database Schema
-- Core Backend Features for Commercial Deployment

-- 1. USER PROFILES & ROLES SYSTEM
CREATE TYPE public.user_role AS ENUM ('admin', 'premium', 'basic');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'standard', 'enterprise');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE public.compliance_risk AS ENUM ('low', 'medium', 'high', 'critical');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role user_role DEFAULT 'basic',
  subscription_tier subscription_tier DEFAULT 'free',
  kyc_status kyc_status DEFAULT 'pending',
  compliance_risk compliance_risk DEFAULT 'low',
  jurisdiction TEXT,
  ip_whitelist TEXT[],
  device_fingerprint TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- 2. SUBSCRIPTION MANAGEMENT
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL,
  tier subscription_tier NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. COMPLIANCE & AUDIT LOGGING
CREATE TABLE public.kyc_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT,
  verification_status kyc_status DEFAULT 'pending',
  risk_score INTEGER DEFAULT 0,
  verification_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tokenization_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- mint, burn, transfer
  asset_symbol TEXT NOT NULL,
  asset_issuer TEXT,
  amount DECIMAL(20,8) NOT NULL,
  xrpl_transaction_hash TEXT,
  xrpl_ledger_index BIGINT,
  compliance_metadata JSONB,
  iso20022_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trade_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID,
  asset_symbol TEXT NOT NULL,
  quantity DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  total_value DECIMAL(20,8) NOT NULL,
  execution_time TIMESTAMPTZ DEFAULT now(),
  settlement_status TEXT DEFAULT 'pending',
  xrpl_transaction_hash TEXT,
  compliance_flags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_behavior_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  location_data JSONB,
  risk_indicators JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TOKENIZATION ENGINE
CREATE TABLE public.tokenized_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_symbol TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  description TEXT,
  total_supply DECIMAL(20,8) NOT NULL,
  circulating_supply DECIMAL(20,8) DEFAULT 0,
  xrpl_currency_code TEXT,
  xrpl_issuer_address TEXT,
  metadata JSONB,
  compliance_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(asset_symbol)
);

CREATE TABLE public.asset_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.tokenized_assets(id) ON DELETE CASCADE NOT NULL,
  balance DECIMAL(20,8) DEFAULT 0,
  locked_balance DECIMAL(20,8) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, asset_id)
);

-- 5. TRADE MATCHING SYSTEM
CREATE TYPE public.order_type AS ENUM ('market', 'limit', 'stop_loss', 'take_profit');
CREATE TYPE public.order_side AS ENUM ('buy', 'sell');
CREATE TYPE public.order_status AS ENUM ('pending', 'partial', 'filled', 'cancelled', 'expired');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.tokenized_assets(id) ON DELETE CASCADE NOT NULL,
  order_type order_type NOT NULL,
  side order_side NOT NULL,
  quantity DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8),
  filled_quantity DECIMAL(20,8) DEFAULT 0,
  remaining_quantity DECIMAL(20,8),
  status order_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SYSTEM CONFIGURATION & ADMIN
CREATE TABLE public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity compliance_risk NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. AI AGENT PLACEHOLDER TABLES
CREATE TABLE public.trading_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_name TEXT NOT NULL,
  parameters JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  performance_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.strategy_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES public.trading_strategies(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.tokenized_assets(id) ON DELETE CASCADE NOT NULL,
  signal_type TEXT NOT NULL, -- buy, sell, hold
  confidence DECIMAL(5,4), -- 0.0000 to 1.0000
  price_target DECIMAL(20,8),
  risk_assessment JSONB,
  executed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokenization_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokenized_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_signals ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- Users can only see their own data
CREATE POLICY "users_own_data" ON public.profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_kyc" ON public.kyc_verification FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_tokenization" ON public.tokenization_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_holdings" ON public.asset_holdings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_orders" ON public.orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_strategies" ON public.trading_strategies FOR ALL USING (auth.uid() = user_id);

-- Public read access for tokenized assets
CREATE POLICY "public_read_assets" ON public.tokenized_assets FOR SELECT USING (true);
CREATE POLICY "creators_manage_assets" ON public.tokenized_assets FOR ALL USING (auth.uid() = creator_id);

-- Admin policies for system management
CREATE POLICY "admin_full_access" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_system_config" ON public.system_config FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_compliance_alerts" ON public.compliance_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Trade executions visible to both parties
CREATE POLICY "trade_parties_access" ON public.trade_executions FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- User behavior logs for admins and self
CREATE POLICY "behavior_log_access" ON public.user_behavior_log FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Strategy signals linked to user's strategies
CREATE POLICY "strategy_signals_access" ON public.strategy_signals FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.trading_strategies ts 
    WHERE ts.id = strategy_id AND ts.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_tokenization_events_user_id ON public.tokenization_events(user_id);
CREATE INDEX idx_tokenization_events_asset ON public.tokenization_events(asset_symbol);
CREATE INDEX idx_trade_executions_buyer ON public.trade_executions(buyer_id);
CREATE INDEX idx_trade_executions_seller ON public.trade_executions(seller_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_asset_id ON public.orders(asset_id);
CREATE INDEX idx_asset_holdings_user_id ON public.asset_holdings(user_id);
CREATE INDEX idx_compliance_alerts_user_id ON public.compliance_alerts(user_id);
CREATE INDEX idx_compliance_alerts_resolved ON public.compliance_alerts(resolved);

-- Create trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tokenized_assets_updated_at BEFORE UPDATE ON public.tokenized_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_strategies_updated_at BEFORE UPDATE ON public.trading_strategies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default system configuration
INSERT INTO public.system_config (key, value, description) VALUES
  ('xrpl_network', '{"endpoint": "wss://s.altnet.rippletest.net:51233", "network_id": 21338}', 'XRPL network configuration'),
  ('trading_fees', '{"maker_fee": 0.001, "taker_fee": 0.002}', 'Trading fee structure'),
  ('compliance_thresholds', '{"daily_limit": 10000, "monthly_limit": 100000, "kyc_required_above": 1000}', 'Compliance monitoring thresholds'),
  ('subscription_features', '{"free": ["view_dashboard"], "standard": ["trading", "basic_analytics"], "enterprise": ["ai_trading", "compliance_reports", "api_access"]}', 'Feature access by subscription tier');

-- Enable realtime for critical tables
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.trade_executions REPLICA IDENTITY FULL;
ALTER TABLE public.compliance_alerts REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.compliance_alerts;