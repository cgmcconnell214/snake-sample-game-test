-- Fix stuck executions and add logging capabilities

-- First, update all stuck executions to 'completed' status
UPDATE ai_agent_executions 
SET 
  status = 'completed',
  completed_at = NOW(),
  execution_time_ms = EXTRACT(EPOCH FROM (NOW() - started_at::timestamp)) * 1000,
  output_data = COALESCE(
    output_data,
    jsonb_build_object(
      'total_steps', 0,
      'successful_steps', 0,
      'failed_steps', 0,
      'step_results', '[]'::jsonb,
      'auto_completed', true,
      'reason', 'System cleanup - execution was stuck'
    )
  )
WHERE status = 'running' 
  AND started_at < NOW() - INTERVAL '1 hour';

-- Add execution logging table for detailed backend logs
CREATE TABLE IF NOT EXISTS ai_agent_execution_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID REFERENCES ai_agent_executions(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  log_level TEXT DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  step_id TEXT,
  step_name TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_execution_logs_execution_id ON ai_agent_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_agent_id ON ai_agent_execution_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_timestamp ON ai_agent_execution_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_execution_logs_level ON ai_agent_execution_logs(log_level);

-- Enable RLS on execution logs
ALTER TABLE ai_agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for execution logs
CREATE POLICY "Users can view execution logs for their agents" 
ON ai_agent_execution_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM ai_agents 
    WHERE ai_agents.id = ai_agent_execution_logs.agent_id 
    AND ai_agents.creator_id = auth.uid()
  )
);

CREATE POLICY "System can insert execution logs" 
ON ai_agent_execution_logs 
FOR INSERT 
WITH CHECK (true);

-- Create a function to automatically clean up old stuck executions
CREATE OR REPLACE FUNCTION cleanup_stuck_executions()
RETURNS void AS $$
BEGIN
  UPDATE ai_agent_executions 
  SET 
    status = 'failed',
    completed_at = NOW(),
    execution_time_ms = EXTRACT(EPOCH FROM (NOW() - started_at::timestamp)) * 1000,
    error_message = 'Execution timed out after 1 hour',
    output_data = COALESCE(
      output_data,
      jsonb_build_object(
        'total_steps', 0,
        'successful_steps', 0,
        'failed_steps', 1,
        'step_results', '[]'::jsonb,
        'auto_failed', true,
        'reason', 'Execution timeout'
      )
    )
  WHERE status = 'running' 
    AND started_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function for agent execution with comprehensive logging
CREATE OR REPLACE FUNCTION execute_ai_agent_workflow(
  agent_id UUID,
  workflow_data JSONB DEFAULT '{}'::jsonb,
  input_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  execution_id UUID;
  agent_record RECORD;
  result JSONB;
BEGIN
  -- Get agent details
  SELECT * INTO agent_record FROM ai_agents WHERE id = agent_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agent not found or inactive: %', agent_id;
  END IF;

  -- Create execution record
  INSERT INTO ai_agent_executions (
    agent_id,
    status,
    started_at,
    input_data
  ) VALUES (
    agent_id,
    'running',
    NOW(),
    input_data
  ) RETURNING id INTO execution_id;

  -- Log execution start
  INSERT INTO ai_agent_execution_logs (
    execution_id,
    agent_id,
    log_level,
    message,
    data
  ) VALUES (
    execution_id,
    agent_id,
    'info',
    'Agent execution started',
    jsonb_build_object(
      'agent_name', agent_record.name,
      'workflow_steps', COALESCE(workflow_data->'steps', '[]'::jsonb),
      'input_data', input_data
    )
  );

  -- Build result
  result := jsonb_build_object(
    'success', true,
    'execution_id', execution_id,
    'agent', jsonb_build_object(
      'id', agent_record.id,
      'name', agent_record.name,
      'creator_id', agent_record.creator_id
    ),
    'workflow_data', workflow_data,
    'input_data', input_data,
    'started_at', NOW()
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error if execution_id exists
    IF execution_id IS NOT NULL THEN
      INSERT INTO ai_agent_execution_logs (
        execution_id,
        agent_id,
        log_level,
        message,
        data
      ) VALUES (
        execution_id,
        agent_id,
        'error',
        'Agent execution failed: ' || SQLERRM,
        jsonb_build_object('error_code', SQLSTATE)
      );

      -- Update execution status to failed
      UPDATE ai_agent_executions 
      SET 
        status = 'failed',
        completed_at = NOW(),
        error_message = SQLERRM
      WHERE id = execution_id;
    END IF;
    
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;