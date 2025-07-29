-- Create table to track XRPL contract deployments
CREATE TABLE IF NOT EXISTS public.contract_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contract_name TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  ledger TEXT NOT NULL,
  deployment_tx_hash TEXT,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_contracts" ON public.contract_deployments
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_all_contracts" ON public.contract_deployments
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE TRIGGER update_contract_deployments_updated_at
BEFORE UPDATE ON public.contract_deployments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
