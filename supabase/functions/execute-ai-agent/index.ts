import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, workflowData, configuration, inputData = {} } = await req.json();

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Executing AI agent: ${agentId}`);

    // Call the database function to execute the workflow
    const { data: executionResult, error: executionError } = await supabase
      .rpc('execute_ai_agent_workflow', {
        agent_id: agentId,
        workflow_data: workflowData || {},
        input_data: inputData
      });

    if (executionError) {
      console.error('Execution error:', executionError);
      return new Response(
        JSON.stringify({ error: 'Failed to execute agent workflow', details: executionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If workflow has steps, simulate processing them
    if (workflowData && workflowData.steps && Array.isArray(workflowData.steps)) {
      console.log(`Processing ${workflowData.steps.length} workflow steps`);
      
      // Simulate step execution
      for (const step of workflowData.steps) {
        console.log(`Executing step: ${step.name} (${step.type})`);
        
        // Here you would implement actual step execution logic
        // For now, we'll just log the step execution
        switch (step.type) {
          case 'trigger':
            console.log(`Trigger executed: ${step.config?.event || 'unknown'}`);
            break;
          case 'notification':
            console.log(`Notification sent: ${step.config?.message || 'no message'}`);
            break;
          case 'email':
            console.log(`Email sent to: ${step.config?.to || 'unknown'}`);
            break;
          case 'action':
            console.log(`Action executed: ${step.name}`);
            break;
          default:
            console.log(`Step executed: ${step.name}`);
        }
      }
    }

    // Update execution record with completion
    const executionId = executionResult.execution_id;
    if (executionId) {
      await supabase
        .from('ai_agent_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output_data: executionResult.result,
          execution_time_ms: executionResult.result?.execution_time_ms || 500
        })
        .eq('id', executionId);
    }

    console.log('Agent execution completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        result: executionResult,
        message: 'Agent executed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in execute-ai-agent function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});