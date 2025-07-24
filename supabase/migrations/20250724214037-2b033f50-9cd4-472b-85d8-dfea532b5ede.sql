-- Create workflow automation rules table
CREATE TABLE IF NOT EXISTS public.workflow_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflow_automation_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own workflow rules" 
ON public.workflow_automation_rules 
FOR ALL 
USING (auth.uid() = user_id);

-- Create liquidity pool positions table
CREATE TABLE IF NOT EXISTS public.liquidity_pool_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pool_id TEXT NOT NULL,
  token_a_amount NUMERIC NOT NULL DEFAULT 0,
  token_b_amount NUMERIC NOT NULL DEFAULT 0,
  lp_tokens NUMERIC NOT NULL DEFAULT 0,
  entry_price NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  rewards_earned NUMERIC NOT NULL DEFAULT 0,
  stake_start_date TIMESTAMP WITH TIME ZONE,
  stake_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.liquidity_pool_positions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own liquidity positions" 
ON public.liquidity_pool_positions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create escrow vaults table
CREATE TABLE IF NOT EXISTS public.escrow_vaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  vault_name TEXT NOT NULL,
  description TEXT,
  asset_id UUID,
  locked_amount NUMERIC NOT NULL DEFAULT 0,
  unlock_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  beneficiaries JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  unlock_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.escrow_vaults ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own escrow vaults" 
ON public.escrow_vaults 
FOR ALL 
USING (auth.uid() = creator_id);

CREATE POLICY "Beneficiaries can view escrow vaults" 
ON public.escrow_vaults 
FOR SELECT 
USING (auth.uid()::text = ANY(SELECT jsonb_array_elements_text(beneficiaries)));

-- Add triggers for updated_at
CREATE TRIGGER update_workflow_automation_rules_updated_at
BEFORE UPDATE ON public.workflow_automation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_liquidity_pool_positions_updated_at
BEFORE UPDATE ON public.liquidity_pool_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escrow_vaults_updated_at
BEFORE UPDATE ON public.escrow_vaults
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();