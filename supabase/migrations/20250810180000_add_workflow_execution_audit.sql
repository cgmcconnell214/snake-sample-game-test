-- Create workflow execution audit table
CREATE TABLE IF NOT EXISTS public.workflow_execution_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid REFERENCES ai_agent_executions(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  executed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.workflow_execution_audit ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own audit records
CREATE POLICY "Users can view their workflow execution audits"
ON public.workflow_execution_audit
FOR SELECT
USING (auth.uid() = user_id);

-- Allow system inserts
CREATE POLICY "system_insert_workflow_execution_audit"
ON public.workflow_execution_audit
FOR INSERT
WITH CHECK (true);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_workflow_execution_audit_user_id ON workflow_execution_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_audit_execution_id ON workflow_execution_audit(execution_id);
