-- Create edge function for executing AI agents
CREATE OR REPLACE FUNCTION public.execute_ai_agent_workflow(
  agent_id uuid,
  workflow_data jsonb,
  input_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  execution_result jsonb;
  agent_record record;
BEGIN
  -- Get the agent details
  SELECT * INTO agent_record 
  FROM ai_agents 
  WHERE id = agent_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Agent not found or inactive'
    );
  END IF;
  
  -- Log the execution attempt
  INSERT INTO ai_agent_executions (
    agent_id,
    input_data,
    status,
    started_at
  ) VALUES (
    agent_id,
    input_data,
    'running',
    now()
  );
  
  -- For now, return a mock successful execution
  -- In a real implementation, this would process the workflow_data
  execution_result := jsonb_build_object(
    'success', true,
    'agent_id', agent_id,
    'agent_name', agent_record.name,
    'execution_id', gen_random_uuid(),
    'result', jsonb_build_object(
      'message', 'Workflow executed successfully',
      'steps_completed', coalesce(jsonb_array_length(workflow_data->'steps'), 0),
      'execution_time_ms', 250 + random() * 500
    ),
    'timestamp', extract(epoch from now())
  );
  
  RETURN execution_result;
END;
$$;

-- Create table for tracking agent executions
CREATE TABLE IF NOT EXISTS public.ai_agent_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES ai_agents(id),
  input_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_data jsonb,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  error_message text,
  execution_time_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the executions table
ALTER TABLE public.ai_agent_executions ENABLE ROW LEVEL SECURITY;

-- Create policies for agent executions
CREATE POLICY "Users can view executions for their agents" 
ON public.ai_agent_executions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM ai_agents 
    WHERE ai_agents.id = ai_agent_executions.agent_id 
    AND ai_agents.creator_id = auth.uid()
  )
);

CREATE POLICY "System can create agent executions" 
ON public.ai_agent_executions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update agent executions" 
ON public.ai_agent_executions 
FOR UPDATE 
USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_executions_agent_id ON ai_agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_executions_status ON ai_agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_ai_agent_executions_created_at ON ai_agent_executions(created_at);