-- Update user to admin role and enterprise subscription
UPDATE public.profiles 
SET 
  role = 'admin',
  subscription_tier = 'enterprise',
  updated_at = now()
WHERE email = 'cgmcconnell214@gmail.com';

-- Create enterprise subscription record
INSERT INTO public.subscriptions (
  user_id,
  tier,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
) VALUES (
  (SELECT user_id FROM profiles WHERE email = 'cgmcconnell214@gmail.com'),
  'enterprise',
  'active',
  now(),
  now() + interval '1 year',
  false,
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  tier = 'enterprise',
  status = 'active',
  current_period_start = now(),
  current_period_end = now() + interval '1 year',
  updated_at = now();

-- Create audit_event_details table for detailed audit logs
CREATE TABLE IF NOT EXISTS public.audit_event_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  error_details JSONB,
  execution_time_ms INTEGER,
  security_context JSONB,
  compliance_flags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_event_details ENABLE ROW LEVEL SECURITY;

-- Admin access to audit details
CREATE POLICY "admin_audit_details" ON public.audit_event_details
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create XRPL integration configuration table
CREATE TABLE IF NOT EXISTS public.xrpl_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_type TEXT NOT NULL DEFAULT 'testnet', -- testnet, mainnet
  issuer_address TEXT,
  hot_wallet_seed TEXT, -- encrypted
  cold_wallet_address TEXT,
  compliance_settings JSONB DEFAULT '{}',
  minting_policies JSONB DEFAULT '{}',
  kyc_requirements JSONB DEFAULT '{}',
  regulatory_framework JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.xrpl_config ENABLE ROW LEVEL SECURITY;

-- Admin only access
CREATE POLICY "admin_xrpl_config" ON public.xrpl_config
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create smart contract functions registry
CREATE TABLE IF NOT EXISTS public.smart_contract_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  contract_type TEXT NOT NULL, -- 'minting', 'trading', 'compliance', 'governance'
  xrpl_transaction_type TEXT, -- 'TrustSet', 'Payment', 'AccountSet', etc.
  parameters JSONB NOT NULL DEFAULT '{}',
  compliance_rules JSONB DEFAULT '{}',
  gas_estimates JSONB DEFAULT '{}',
  deployment_status TEXT DEFAULT 'draft', -- draft, testing, deployed, deprecated
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_contract_functions ENABLE ROW LEVEL SECURITY;

-- Admin access
CREATE POLICY "admin_smart_contracts" ON public.smart_contract_functions
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Insert initial smart contract functions for XRPL ecosystem
INSERT INTO public.smart_contract_functions (function_name, contract_type, xrpl_transaction_type, parameters, compliance_rules) VALUES
('create_token', 'minting', 'TrustSet', 
 '{"currency": "string", "issuer": "string", "limit": "number", "flags": "number"}',
 '{"kyc_required": true, "regulatory_approval": true, "max_supply": 1000000000}'),
('mint_tokens', 'minting', 'Payment', 
 '{"destination": "string", "amount": "number", "currency": "string", "memo": "string"}',
 '{"kyc_verified": true, "aml_check": true, "daily_limit": 10000000}'),
('burn_tokens', 'minting', 'Payment', 
 '{"amount": "number", "currency": "string", "reason": "string"}',
 '{"admin_approval": true, "audit_trail": true}'),
('freeze_account', 'compliance', 'AccountSet', 
 '{"account": "string", "freeze_flag": "boolean", "reason": "string"}',
 '{"admin_only": true, "legal_basis": "required", "appeal_process": true}'),
('execute_trade', 'trading', 'OfferCreate', 
 '{"taker_pays": "object", "taker_gets": "object", "expiration": "number"}',
 '{"kyc_verified": true, "trade_limits": true, "market_hours": true}');

-- Create blockchain transaction queue
CREATE TABLE IF NOT EXISTS public.blockchain_transaction_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  function_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  parameters JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  xrpl_transaction_hash TEXT,
  xrpl_ledger_index BIGINT,
  gas_used INTEGER,
  compliance_check_status JSONB DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blockchain_transaction_queue ENABLE ROW LEVEL SECURITY;

-- Users can see their own transactions
CREATE POLICY "users_own_transactions" ON public.blockchain_transaction_queue
FOR SELECT
USING (auth.uid() = user_id);

-- Admin can see all
CREATE POLICY "admin_all_transactions" ON public.blockchain_transaction_queue
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create compliance monitoring table
CREATE TABLE IF NOT EXISTS public.compliance_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES blockchain_transaction_queue(id),
  user_id UUID REFERENCES auth.users(id),
  compliance_type TEXT NOT NULL, -- 'KYC', 'AML', 'SANCTIONS', 'TAX_REPORTING'
  status TEXT NOT NULL, -- 'pass', 'fail', 'pending', 'requires_review'
  risk_score INTEGER DEFAULT 0,
  flags TEXT[],
  regulatory_framework TEXT, -- 'US_SEC', 'EU_MIFID', 'UK_FCA', etc.
  review_required BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  compliance_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_monitoring ENABLE ROW LEVEL SECURITY;

-- Compliance staff access
CREATE POLICY "compliance_access" ON public.compliance_monitoring
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin', 'compliance')
));

-- Create regulatory reporting table
CREATE TABLE IF NOT EXISTS public.regulatory_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL, -- 'CFTC', 'SEC', 'FINRA', 'FATF', 'TAX'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  jurisdiction TEXT NOT NULL,
  report_data JSONB NOT NULL,
  file_path TEXT,
  status TEXT DEFAULT 'draft', -- draft, submitted, approved, rejected
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regulatory_reports ENABLE ROW LEVEL SECURITY;

-- Admin only
CREATE POLICY "admin_regulatory_reports" ON public.regulatory_reports
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Insert initial XRPL configuration
INSERT INTO public.xrpl_config (
  network_type,
  compliance_settings,
  minting_policies,
  kyc_requirements,
  regulatory_framework
) VALUES (
  'testnet',
  '{
    "require_kyc": true,
    "aml_monitoring": true,
    "sanctions_screening": true,
    "transaction_monitoring": true,
    "suspicious_activity_reporting": true
  }',
  '{
    "max_daily_mint": 10000000,
    "max_single_mint": 1000000,
    "require_multi_sig": true,
    "cooling_period_hours": 24,
    "burn_rate_limit": 0.1
  }',
  '{
    "identity_verification": "required",
    "document_verification": "required",
    "address_verification": "required",
    "source_of_funds": "required",
    "ongoing_monitoring": "required"
  }',
  '{
    "primary_jurisdiction": "US",
    "sec_compliance": true,
    "cftc_compliance": true,
    "finra_reporting": true,
    "fatf_guidelines": true,
    "data_protection": "GDPR_CCPA"
  }'
) ON CONFLICT DO NOTHING;