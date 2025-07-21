-- Create remaining blockchain infrastructure tables

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

-- Add some sample audit event details
INSERT INTO public.audit_event_details (event_id, request_data, response_data, execution_time_ms, security_context, compliance_flags) VALUES
('1', 
 '{"action": "create_token", "parameters": {"symbol": "XRPL-GOLD", "supply": 1000}}',
 '{"status": "success", "transaction_hash": "0x123...abc", "token_id": "tok_001"}',
 250,
 '{"ip_address": "192.168.1.100", "user_agent": "Mozilla/5.0", "session_id": "sess_001"}',
 ARRAY['KYC_VERIFIED', 'AML_CLEARED']),
('2',
 '{"action": "execute_trade", "parameters": {"amount": 50, "asset": "XRPL-USD"}}',
 '{"status": "success", "trade_id": "trade_001", "execution_price": 2.1}',
 150,
 '{"ip_address": "192.168.1.101", "user_agent": "Mozilla/5.0", "session_id": "sess_002"}',
 ARRAY['TRADE_LIMITS_OK', 'MARKET_HOURS_VALID']);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS update_xrpl_config_updated_at ON public.xrpl_config;
CREATE TRIGGER update_xrpl_config_updated_at
  BEFORE UPDATE ON public.xrpl_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_smart_contract_functions_updated_at ON public.smart_contract_functions;
CREATE TRIGGER update_smart_contract_functions_updated_at
  BEFORE UPDATE ON public.smart_contract_functions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blockchain_transaction_queue_updated_at ON public.blockchain_transaction_queue;
CREATE TRIGGER update_blockchain_transaction_queue_updated_at
  BEFORE UPDATE ON public.blockchain_transaction_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();