import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TestTube, 
  Database,
  Code,
  Zap,
  Clock,
  Users,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  details?: any;
  duration?: number;
}

interface AuditResults {
  overall: 'pass' | 'fail' | 'warning';
  score: number;
  tests: TestResult[];
  executionLogs: any[];
}

export function AgentAuditor() {
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState("");
  const { toast } = useToast();

  const runAudit = async () => {
    setIsRunning(true);
    setCurrentTest("Starting audit...");
    
    const results: TestResult[] = [];
    const executionLogs: any[] = [];

    try {
      // Test 1: Database Connectivity
      setCurrentTest("Testing database connectivity...");
      const dbTest = await testDatabaseConnectivity();
      results.push(dbTest);

      // Test 2: Agent Creation
      setCurrentTest("Testing agent creation...");
      const createTest = await testAgentCreation();
      results.push(createTest);
      
      // Test 3: Workflow Persistence
      setCurrentTest("Testing workflow persistence...");
      const workflowTest = await testWorkflowPersistence(createTest.details?.agentId);
      results.push(workflowTest);

      // Test 4: Agent Execution
      setCurrentTest("Testing agent execution...");
      const executionTest = await testAgentExecution(createTest.details?.agentId);
      results.push(executionTest);
      if (executionTest.details) {
        executionLogs.push(executionTest.details);
      }

      // Test 5: API Key Generation
      setCurrentTest("Testing API key generation...");
      const apiKeyTest = await testAPIKeyGeneration(createTest.details?.agentId);
      results.push(apiKeyTest);

      // Test 6: Agent Purchase
      setCurrentTest("Testing agent purchase...");
      const purchaseTest = await testAgentPurchase(createTest.details?.agentId);
      results.push(purchaseTest);

      // Test 7: Agent Deletion
      setCurrentTest("Testing agent deletion...");
      const deleteTest = await testAgentDeletion(createTest.details?.agentId);
      results.push(deleteTest);

      // Calculate overall results
      const passCount = results.filter(r => r.status === 'pass').length;
      const failCount = results.filter(r => r.status === 'fail').length;
      const score = Math.round((passCount / results.length) * 100);
      
      const overall: 'pass' | 'fail' | 'warning' = 
        failCount === 0 ? 'pass' : 
        failCount > results.length / 2 ? 'fail' : 'warning';

      setAuditResults({
        overall,
        score,
        tests: results,
        executionLogs
      });

      toast({
        title: "Audit Complete",
        description: `Score: ${score}% (${passCount} passed, ${failCount} failed)`,
      });

    } catch (error) {
      console.error('Audit failed:', error);
      toast({
        title: "Audit Failed",
        description: "An error occurred during the audit",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  };

  const testDatabaseConnectivity = async (): Promise<TestResult> => {
    const start = Date.now();
    try {
      const { data, error } = await supabase.from('ai_agents').select('count').limit(1);
      if (error) throw error;
      
      return {
        name: "Database Connectivity",
        status: 'pass',
        message: "Successfully connected to Supabase database",
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: "Database Connectivity",
        status: 'fail',
        message: `Database connection failed: ${error.message}`,
        duration: Date.now() - start
      };
    }
  };

  const testAgentCreation = async (): Promise<TestResult> => {
    const start = Date.now();
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      const testAgent = {
        name: `Test Agent ${Date.now()}`,
        description: "Automated test agent for auditing",
        category: "workflow",
        agent_type: "workflow",
        price_per_use: 0.01,
        total_tokens: 10000,
        creator_id: user.id,
        workflow_data: {
          steps: [
            {
              id: "test_step_1",
              type: "trigger",
              name: "Test Trigger",
              description: "Test trigger step",
              config: { event: "manual" },
              position: 0
            }
          ],
          metadata: {
            version: "1.0",
            created_at: new Date().toISOString(),
            total_steps: 1
          }
        },
        configuration: {
          napier_integration: true,
          tokenomics_enabled: true,
          revenue_sharing: true
        }
      };

      const { data, error } = await supabase
        .from('ai_agents')
        .insert(testAgent)
        .select()
        .single();

      if (error) throw error;

      return {
        name: "Agent Creation",
        status: 'pass',
        message: "Successfully created test agent",
        details: { agentId: data.id, agent: data },
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: "Agent Creation",
        status: 'fail',
        message: `Agent creation failed: ${error.message}`,
        duration: Date.now() - start
      };
    }
  };

  const testWorkflowPersistence = async (agentId: string): Promise<TestResult> => {
    const start = Date.now();
    try {
      if (!agentId) throw new Error("No agent ID provided");

      // Update workflow
      const updatedWorkflow = {
        steps: [
          {
            id: "test_step_1",
            type: "trigger",
            name: "Test Trigger",
            description: "Test trigger step",
            config: { event: "manual" },
            position: 0
          },
          {
            id: "test_step_2",
            type: "notification",
            name: "Test Notification",
            description: "Test notification step",
            config: { message: "Test notification from audit", recipient: "system" },
            position: 1
          }
        ],
        metadata: {
          version: "1.1",
          updated_at: new Date().toISOString(),
          total_steps: 2
        }
      };

      const { data, error } = await supabase
        .from('ai_agents')
        .update({ workflow_data: updatedWorkflow })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;

      // Verify persistence
      const { data: retrieved, error: retrieveError } = await supabase
        .from('ai_agents')
        .select('workflow_data')
        .eq('id', agentId)
        .single();

      if (retrieveError) throw retrieveError;

      const workflowData = retrieved.workflow_data as any;
      const isWorkflowPersisted = 
        workflowData && 
        workflowData.steps && 
        workflowData.steps.length === 2;

      return {
        name: "Workflow Persistence",
        status: isWorkflowPersisted ? 'pass' : 'fail',
        message: isWorkflowPersisted 
          ? "Workflow data successfully persisted and retrieved"
          : "Workflow data not properly persisted",
        details: { workflow: retrieved.workflow_data },
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: "Workflow Persistence",
        status: 'fail',
        message: `Workflow persistence test failed: ${error.message}`,
        duration: Date.now() - start
      };
    }
  };

  const testAgentExecution = async (agentId: string): Promise<TestResult> => {
    const start = Date.now();
    try {
      if (!agentId) throw new Error("No agent ID provided");

      const { data, error } = await supabase.functions.invoke('execute-ai-agent', {
        body: {
          agentId,
          workflowData: {
            steps: [
              {
                id: "audit_trigger",
                type: "trigger",
                name: "Audit Trigger",
                config: { event: "audit_test" }
              },
              {
                id: "audit_notification",
                type: "notification",
                name: "Audit Notification",
                config: { message: "Audit test notification", recipient: "system" }
              }
            ]
          },
          inputData: {
            test_mode: true,
            audit_timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      const result = data?.result || {};
      const success = result.success && result.total_steps > 0;

      return {
        name: "Agent Execution",
        status: success ? 'pass' : 'fail',
        message: success 
          ? `Agent executed successfully: ${result.successful_steps}/${result.total_steps} steps completed`
          : "Agent execution failed or returned no results",
        details: result,
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: "Agent Execution",
        status: 'fail',
        message: `Agent execution test failed: ${error.message}`,
        duration: Date.now() - start
      };
    }
  };

  const testAPIKeyGeneration = async (agentId: string): Promise<TestResult> => {
    const start = Date.now();
    try {
      if (!agentId) throw new Error("No agent ID provided");

      const apiKey = `ak_${agentId.substring(0, 8)}_${Date.now().toString(36)}_test`;
      
      const { data, error } = await supabase
        .from('ai_agents')
        .update({
          configuration: {
            api_key: apiKey,
            api_key_created_at: new Date().toISOString()
          }
        })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;

      const configuration = data.configuration as any;
      const hasApiKey = configuration?.api_key === apiKey;

      return {
        name: "API Key Generation",
        status: hasApiKey ? 'pass' : 'fail',
        message: hasApiKey 
          ? "API key successfully generated and stored"
          : "API key generation failed",
        details: { apiKey: hasApiKey ? apiKey : null },
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: "API Key Generation",
        status: 'fail',
        message: `API key generation test failed: ${error.message}`,
        duration: Date.now() - start
      };
    }
  };

  const testAgentPurchase = async (agentId: string): Promise<TestResult> => {
    const start = Date.now();
    try {
      if (!agentId) throw new Error("No agent ID provided");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('ai_agent_purchases')
        .insert({
          buyer_id: user.id,
          agent_id: agentId,
          tokens_purchased: 100,
          total_amount: 1.00,
          payment_status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        name: "Agent Purchase",
        status: 'pass',
        message: "Agent purchase successfully recorded",
        details: { purchaseId: data.id },
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: "Agent Purchase",
        status: 'fail',
        message: `Agent purchase test failed: ${error.message}`,
        duration: Date.now() - start
      };
    }
  };

  const testAgentDeletion = async (agentId: string): Promise<TestResult> => {
    const start = Date.now();
    try {
      if (!agentId) throw new Error("No agent ID provided");

      const { error } = await supabase
        .from('ai_agents')
        .update({ is_active: false })
        .eq('id', agentId);

      if (error) throw error;

      return {
        name: "Agent Deletion",
        status: 'pass',
        message: "Agent successfully marked as inactive",
        duration: Date.now() - start
      };
    } catch (error) {
      return {
        name: "Agent Deletion",
        status: 'fail',
        message: `Agent deletion test failed: ${error.message}`,
        duration: Date.now() - start
      };
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-500';
      case 'fail':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive testing of all AI Agents functionality
          </p>
        </div>
        <Button onClick={runAudit} disabled={isRunning}>
          <TestTube className="h-4 w-4 mr-2" />
          {isRunning ? "Running Audit..." : "Run Full Audit"}
        </Button>
      </div>

      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>{currentTest}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {auditResults && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
            <TabsTrigger value="execution">Execution Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(auditResults.overall)}`} />
                  Audit Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Overall Score</span>
                      <span className="font-bold">{auditResults.score}%</span>
                    </div>
                    <Progress value={auditResults.score} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {auditResults.tests.filter(t => t.status === 'pass').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">
                        {auditResults.tests.filter(t => t.status === 'fail').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">
                        {auditResults.tests.filter(t => t.status === 'warning').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Warnings</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            {auditResults.tests.map((test, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h3 className="font-semibold">{test.name}</h3>
                        <p className="text-sm text-muted-foreground">{test.message}</p>
                        {test.duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Duration: {test.duration}ms
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={test.status === 'pass' ? 'default' : 'destructive'}>
                      {test.status}
                    </Badge>
                  </div>
                  {test.details && (
                    <details className="mt-3">
                      <summary className="text-sm cursor-pointer text-muted-foreground">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="execution" className="space-y-4">
            {auditResults.executionLogs.map((log, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm">Execution Log {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(log, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}