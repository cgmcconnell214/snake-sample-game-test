-- Complete the blockchain infrastructure tables

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
 '{"kyc_verified": true, "trade_limits": true, "market_hours": true}') 
ON CONFLICT DO NOTHING;