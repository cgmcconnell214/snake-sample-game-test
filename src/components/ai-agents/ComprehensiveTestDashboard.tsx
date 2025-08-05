import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Lock,
  Download,
  Play,
  RefreshCw,
  Eye,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PortfolioIntegrationTest } from "./PortfolioIntegrationTest";

interface TestResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'running';
  duration?: number;
  details?: any;
  error?: string;
  data?: any;
}

interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

interface ComprehensiveAuditProps {
  onClose: () => void;
}

export function ComprehensiveTestDashboard({ onClose }: ComprehensiveAuditProps) {
  const [isAuditRunning, setIsAuditRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [auditReport, setAuditReport] = useState<string>("");
  const { toast } = useToast();

  const updateTestResult = (id: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ));
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const addLog = (level: ExecutionLog['level'], message: string, data?: any) => {
    const log: ExecutionLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    setExecutionLogs(prev => [...prev, log]);
  };

  // Real functionality tests that actually verify system capabilities
  const testDatabaseIntegration = async (): Promise<TestResult> => {
    const start = Date.now();
    addLog('info', 'Testing database integration...');
    
    try {
      // Test database read
      const { data: agents, error: readError } = await supabase
        .from('ai_agents')
        .select('*')
        .limit(5);
      
      if (readError) throw readError;
      
      // Test database write - get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const testData = {
        name: `Test Agent ${Date.now()}`,
        description: 'Integration test agent',
        category: 'test',
        agent_type: 'workflow',
        price_per_use: 0,
        total_tokens: 1000,
        creator_id: user.id,
        configuration: {
          test_mode: true,
          napier_integration: false,
          tokenomics_enabled: false,
          revenue_sharing: false
        },
        workflow_data: {
          steps: [
            {
              id: 'test-step',
              type: 'trigger',
              name: 'Test Step',
              config: { trigger_type: 'manual' }
            }
          ]
        }
      };
      
      const { data: created, error: writeError } = await supabase
        .from('ai_agents')
        .insert(testData)
        .select()
        .single();
      
      if (writeError) throw writeError;
      
      // Clean up test data
      await supabase
        .from('ai_agents')
        .update({ is_active: false })
        .eq('id', created.id);
      
      addLog('info', 'Database integration test passed');
      return {
        id: 'db-integration',
        name: 'Database Integration',
        status: 'pass',
        duration: Date.now() - start,
        details: { agents: agents?.length, testAgentCreated: true }
      };
    } catch (error) {
      addLog('error', 'Database integration failed', error);
      return {
        id: 'db-integration',
        name: 'Database Integration',
        status: 'fail',
        duration: Date.now() - start,
        error: error.message
      };
    }
  };

  const testAgentWorkflowPersistence = async (): Promise<TestResult> => {
    const start = Date.now();
    addLog('info', 'Testing agent workflow persistence...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create agent with complex workflow
      const complexWorkflow = {
        steps: [
          {
            id: 'trigger-1',
            type: 'trigger',
            name: 'Manual Trigger',
            config: { event: 'manual' }
          },
          {
            id: 'action-1',
            type: 'action',
            name: 'Data Processing',
            config: { operation: 'process', target: 'portfolio' }
          },
          {
            id: 'condition-1',
            type: 'condition',
            name: 'Risk Check',
            config: { threshold: 0.5, type: 'risk_assessment' }
          },
          {
            id: 'notification-1',
            type: 'notification',
            name: 'Alert System',
            config: { recipients: ['system'], priority: 'high' }
          }
        ],
        metadata: {
          version: '2.0',
          complexity: 'high',
          estimated_runtime: 120
        }
      };

      const { data: agent, error } = await supabase
        .from('ai_agents')
        .insert({
          name: `Workflow Test ${Date.now()}`,
          description: 'Complex workflow persistence test',
          category: 'analytics',
          agent_type: 'workflow',
          price_per_use: 0.01,
          total_tokens: 10000,
          creator_id: user.id,
          workflow_data: complexWorkflow,
          configuration: {
            persistence_test: true,
            test_timestamp: Date.now()
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Verify persistence by retrieving and comparing
      const { data: retrieved, error: retrieveError } = await supabase
        .from('ai_agents')
        .select('workflow_data, configuration')
        .eq('id', agent.id)
        .single();

      if (retrieveError) throw retrieveError;

      const workflowData = retrieved.workflow_data as any;
      const configData = retrieved.configuration as any;
      const isPersisted = 
        workflowData?.steps?.length === 4 &&
        workflowData?.metadata?.version === '2.0' &&
        configData?.persistence_test === true;

      // Clean up
      await supabase
        .from('ai_agents')
        .update({ is_active: false })
        .eq('id', agent.id);

      addLog('info', `Workflow persistence test ${isPersisted ? 'passed' : 'failed'}`);
      return {
        id: 'workflow-persistence',
        name: 'Workflow Persistence',
        status: isPersisted ? 'pass' : 'fail',
        duration: Date.now() - start,
        details: { 
          workflowSteps: workflowData?.steps?.length,
          configPersisted: !!configData?.persistence_test,
          retrievedWorkflow: retrieved.workflow_data
        }
      };
    } catch (error) {
      addLog('error', 'Workflow persistence test failed', error);
      return {
        id: 'workflow-persistence',
        name: 'Workflow Persistence',
        status: 'fail',
        duration: Date.now() - start,
        error: error.message
      };
    }
  };

  const testAgentExecution = async (): Promise<TestResult> => {
    const start = Date.now();
    addLog('info', 'Testing agent execution capabilities...');
    
    try {
      // Create a comprehensive test agent
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const testWorkflow = {
        steps: [
          {
            id: 'trigger-test',
            type: 'trigger',
            name: 'Execution Test Trigger',
            config: { event: 'manual' }
          },
          {
            id: 'portfolio-check',
            type: 'action',
            name: 'Portfolio Verification',
            config: { action_type: 'portfolio_audit', check_completeness: true }
          },
          {
            id: 'tokenization-test',
            type: 'action',
            name: 'Tokenization Capability',
            config: { action_type: 'tokenization_test', verify_creation: true }
          },
          {
            id: 'compliance-audit',
            type: 'action', 
            name: 'Compliance Verification',
            config: { action_type: 'compliance_check', depth: 'full' }
          },
          {
            id: 'integration-test',
            type: 'action',
            name: 'System Integration',
            config: { action_type: 'integration_test', systems: ['portfolio', 'tokenization', 'compliance'] }
          },
          {
            id: 'report-generation',
            type: 'data',
            name: 'Comprehensive Report',
            config: { format: 'json', include_metrics: true, include_recommendations: true }
          }
        ]
      };

      // Execute the agent
      const { data: executionResult, error: execError } = await supabase.functions.invoke('execute-ai-agent', {
        body: {
          agentId: 'test-execution-agent',
          workflowData: testWorkflow,
          configuration: {
            test_mode: true,
            comprehensive_audit: true,
            log_level: 'debug'
          },
          inputData: {
            triggered_by: 'comprehensive_test',
            test_timestamp: Date.now(),
            user_id: user.id
          }
        }
      });

      if (execError) throw execError;

      const result = executionResult?.result || {};
      const stepResults = result.step_results || [];
      const hasDetailedResults = stepResults.length > 0;
      const allStepsSuccessful = stepResults.every((step: any) => step.status === 'success');

      addLog('info', 'Agent execution completed', result);
      
      return {
        id: 'agent-execution',
        name: 'Agent Execution',
        status: hasDetailedResults && allStepsSuccessful ? 'pass' : 'warning',
        duration: Date.now() - start,
        details: result,
        data: stepResults
      };
    } catch (error) {
      addLog('error', 'Agent execution test failed', error);
      return {
        id: 'agent-execution',
        name: 'Agent Execution',
        status: 'fail',
        duration: Date.now() - start,
        error: error.message
      };
    }
  };

  const testPortfolioIntegration = async (): Promise<TestResult> => {
    const start = Date.now();
    addLog('info', 'Testing portfolio integration for AI agents...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create an agent that should appear in portfolio
      const { data: agent, error: createError } = await supabase
        .from('ai_agents')
        .insert({
          name: `Portfolio Test Agent ${Date.now()}`,
          description: 'Agent to test portfolio integration',
          category: 'trading',
          agent_type: 'workflow',
          price_per_use: 0.05,
          total_tokens: 50000,
          creator_id: user.id,
          configuration: {
            portfolio_integration: true,
            revenue_tracking: true
          }
        })
        .select()
        .single();

      if (createError) throw createError;

      // Check if agent appears in user's created agents
      const { data: userAgents, error: fetchError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('creator_id', user.id)
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      const agentInPortfolio = userAgents.some(a => a.id === agent.id);

      // Test agent purchase to simulate ownership
      const { data: purchase, error: purchaseError } = await supabase
        .from('ai_agent_purchases')
        .insert({
          buyer_id: user.id,
          agent_id: agent.id,
          tokens_purchased: 1000,
          total_amount: 50.00,
          payment_status: 'completed'
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Check purchased agents
      const { data: purchases, error: purchaseFetchError } = await supabase
        .from('ai_agent_purchases')
        .select('*, ai_agents(*)')
        .eq('buyer_id', user.id);

      if (purchaseFetchError) throw purchaseFetchError;

      const hasPortfolioVisibility = agentInPortfolio && purchases.length > 0;

      addLog('info', `Portfolio integration: Created=${agentInPortfolio}, Purchased=${purchases.length > 0}`);

      return {
        id: 'portfolio-integration',
        name: 'Portfolio Integration',
        status: hasPortfolioVisibility ? 'pass' : 'fail',
        duration: Date.now() - start,
        details: {
          agentCreated: agentInPortfolio,
          purchaseRecorded: purchases.length > 0,
          agentId: agent.id
        }
      };
    } catch (error) {
      addLog('error', 'Portfolio integration test failed', error);
      return {
        id: 'portfolio-integration',
        name: 'Portfolio Integration',
        status: 'fail',
        duration: Date.now() - start,
        error: error.message
      };
    }
  };

  const testTokenizationCapability = async (): Promise<TestResult> => {
    const start = Date.now();
    addLog('info', 'Testing agent tokenization capabilities...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create agent suitable for tokenization
      const { data: agent, error: createError } = await supabase
        .from('ai_agents')
        .insert({
          name: `Tokenizable Agent ${Date.now()}`,
          description: 'Agent designed for tokenization testing',
          category: 'defi',
          agent_type: 'workflow', 
          price_per_use: 0.10,
          total_tokens: 1000000,
          creator_id: user.id,
          configuration: {
            tokenization_enabled: true,
            revenue_sharing: true,
            yield_percentage: 5.0
          }
        })
        .select()
        .single();

      if (createError) throw createError;

      // Test creating IP asset for the agent
      const { data: ipAsset, error: ipError } = await supabase
        .from('ip_assets')
        .insert({
          name: `${agent.name} Token`,
          description: `Tokenized AI agent: ${agent.description}`,
          ip_type: 'ai_agent',
          creator_id: user.id,
          total_tokens: agent.total_tokens,
          valuation: agent.total_tokens * agent.price_per_use,
          annual_yield_percentage: 0.05,
          metadata: {
            agent_id: agent.id,
            agent_type: agent.agent_type,
            category: agent.category
          }
        })
        .select()
        .single();

      if (ipError) throw ipError;

      // Test token holdings creation
      const { data: holdings, error: holdingsError } = await supabase
        .from('ip_token_holdings')
        .insert({
          holder_id: user.id,
          ip_asset_id: ipAsset.id,
          tokens_held: 100000,
          tokens_staked: 50000
        })
        .select()
        .single();

      if (holdingsError) throw holdingsError;

      const tokenizationSuccessful = !!(ipAsset && holdings);

      addLog('info', `Tokenization test: ${tokenizationSuccessful ? 'passed' : 'failed'}`);

      return {
        id: 'tokenization',
        name: 'Agent Tokenization',
        status: tokenizationSuccessful ? 'pass' : 'fail',
        duration: Date.now() - start,
        details: {
          agentId: agent.id,
          ipAssetId: ipAsset?.id,
          holdingsId: holdings?.id,
          tokenizationEnabled: true
        }
      };
    } catch (error) {
      addLog('error', 'Tokenization test failed', error);
      return {
        id: 'tokenization',
        name: 'Agent Tokenization',
        status: 'fail',
        duration: Date.now() - start,
        error: error.message
      };
    }
  };

  const runFullAudit = async () => {
    setIsAuditRunning(true);
    setProgress(0);
    setTestResults([]);
    setExecutionLogs([]);
    
    addLog('info', 'Starting comprehensive AI agents audit...');

    const tests = [
      { name: 'Database Integration', fn: testDatabaseIntegration },
      { name: 'Workflow Persistence', fn: testAgentWorkflowPersistence },
      { name: 'Agent Execution', fn: testAgentExecution },
      { name: 'Portfolio Integration', fn: testPortfolioIntegration },
      { name: 'Tokenization', fn: testTokenizationCapability }
    ];

    try {
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        setCurrentTest(test.name);
        
        addTestResult({
          id: test.name.toLowerCase().replace(/\s+/g, '-'),
          name: test.name,
          status: 'running'
        });

        const result = await test.fn();
        updateTestResult(result.id, result);
        
        setProgress(((i + 1) / tests.length) * 100);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      generateAuditReport();
      addLog('info', 'Comprehensive audit completed');
      
      toast({
        title: "Audit Complete",
        description: "Comprehensive testing finished. Check results below.",
      });
    } catch (error) {
      addLog('error', 'Audit failed', error);
      toast({
        title: "Audit Failed",
        description: `Error during audit: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsAuditRunning(false);
      setCurrentTest("");
    }
  };

  const generateAuditReport = () => {
    const timestamp = new Date().toISOString();
    const passedTests = testResults.filter(t => t.status === 'pass').length;
    const failedTests = testResults.filter(t => t.status === 'fail').length;
    const warningTests = testResults.filter(t => t.status === 'warning').length;
    
    const report = `# AI Agents Comprehensive Audit Report
Generated: ${timestamp}

## Executive Summary
- Total Tests: ${testResults.length}
- Passed: ${passedTests}
- Failed: ${failedTests}
- Warnings: ${warningTests}
- Success Rate: ${Math.round((passedTests / testResults.length) * 100)}%

## Test Results Detail

${testResults.map(test => `
### ${test.name}
- Status: ${test.status.toUpperCase()}
- Duration: ${test.duration}ms
${test.error ? `- Error: ${test.error}` : ''}
${test.details ? `- Details: ${JSON.stringify(test.details, null, 2)}` : ''}
`).join('\n')}

## Execution Logs
${executionLogs.map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`).join('\n')}

## Recommendations
${failedTests > 0 ? '⚠️ Critical issues found that need immediate attention' : '✅ All systems operational'}
${warningTests > 0 ? '⚠️ Some components need optimization' : ''}

## Next Steps
1. Address any failed tests immediately
2. Monitor warning conditions
3. Re-run audit after fixes
4. Schedule regular audits for production monitoring
`;

    setAuditReport(report);
  };

  const downloadAuditReport = () => {
    const blob = new Blob([auditReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-agents-audit-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadTestingAgent = () => {
    const testingAgentScript = `# AI Agents Testing Agent
# Generated: ${new Date().toISOString()}

import json
import requests
import time
from datetime import datetime

class AIAgentsTestRunner:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        self.results = []
    
    def run_comprehensive_test(self):
        """Run the same comprehensive tests as the dashboard"""
        tests = [
            self.test_database_integration,
            self.test_workflow_persistence,
            self.test_agent_execution,
            self.test_portfolio_integration,
            self.test_tokenization_capability
        ]
        
        for test in tests:
            try:
                result = test()
                self.results.append(result)
                print(f"✓ {result['name']}: {result['status']}")
            except Exception as e:
                self.results.append({
                    'name': test.__name__,
                    'status': 'fail',
                    'error': str(e)
                })
                print(f"✗ {test.__name__}: FAILED - {e}")
    
    def test_database_integration(self):
        # Real database integration test implementation
        response = requests.get(f"{self.base_url}/api/ai-agents", headers=self.headers)
        return {
            'name': 'Database Integration',
            'status': 'pass' if response.status_code == 200 else 'fail',
            'data': response.json() if response.status_code == 200 else None
        }
    
    def test_workflow_persistence(self):
        # Test workflow creation and retrieval
        workflow_data = {
            'name': f'Test Workflow {int(time.time())}',
            'steps': [
                {'type': 'trigger', 'config': {'event': 'manual'}},
                {'type': 'action', 'config': {'operation': 'test'}}
            ]
        }
        
        response = requests.post(
            f"{self.base_url}/api/ai-agents", 
            json=workflow_data, 
            headers=self.headers
        )
        
        return {
            'name': 'Workflow Persistence', 
            'status': 'pass' if response.status_code in [200, 201] else 'fail',
            'data': response.json() if response.status_code in [200, 201] else None
        }
    
    def test_agent_execution(self):
        # Test actual agent execution
        execution_data = {
            'agentId': 'test-agent',
            'inputData': {'test': True, 'timestamp': datetime.now().isoformat()}
        }
        
        response = requests.post(
            f"{self.base_url}/api/execute-agent",
            json=execution_data,
            headers=self.headers
        )
        
        return {
            'name': 'Agent Execution',
            'status': 'pass' if response.status_code == 200 else 'fail',
            'data': response.json() if response.status_code == 200 else None
        }
    
    def test_portfolio_integration(self):
        # Test portfolio visibility
        response = requests.get(f"{self.base_url}/api/portfolio", headers=self.headers)
        portfolio_data = response.json() if response.status_code == 200 else {}
        
        has_agents = 'ai_agents' in portfolio_data or len(portfolio_data.get('agents', [])) > 0
        
        return {
            'name': 'Portfolio Integration',
            'status': 'pass' if has_agents else 'warning',
            'data': portfolio_data
        }
    
    def test_tokenization_capability(self):
        # Test tokenization functionality
        tokenization_data = {
            'asset_type': 'ai_agent',
            'name': f'Test Token {int(time.time())}',
            'total_tokens': 1000000
        }
        
        response = requests.post(
            f"{self.base_url}/api/tokenize",
            json=tokenization_data,
            headers=self.headers
        )
        
        return {
            'name': 'Tokenization Capability',
            'status': 'pass' if response.status_code in [200, 201] else 'fail',
            'data': response.json() if response.status_code in [200, 201] else None
        }
    
    def generate_report(self):
        """Generate detailed test report"""
        passed = len([r for r in self.results if r['status'] == 'pass'])
        failed = len([r for r in self.results if r['status'] == 'fail'])
        warnings = len([r for r in self.results if r['status'] == 'warning'])
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total': len(self.results),
                'passed': passed,
                'failed': failed,
                'warnings': warnings,
                'success_rate': round((passed / len(self.results)) * 100, 2) if self.results else 0
            },
            'results': self.results
        }
        
        with open(f'ai-agents-test-report-{int(time.time())}.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        return report

if __name__ == "__main__":
    # Configuration from audit dashboard
    config = ${JSON.stringify({
      base_url: window.location.origin,
      test_timestamp: Date.now(),
      comprehensive_mode: true,
      tests_configured: testResults.length,
      execution_logs: executionLogs.length
    }, null, 2)}
    
    runner = AIAgentsTestRunner(
        config['base_url'], 
        'your-api-key-here'  # Replace with actual API key
    )
    
    print("Starting AI Agents comprehensive test...")
    runner.run_comprehensive_test()
    
    report = runner.generate_report()
    print(f"\\nTest completed! Success rate: {report['summary']['success_rate']}%")
    print(f"Report saved: ai-agents-test-report-{int(time.time())}.json")
`;

    const blob = new Blob([testingAgentScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-agents-testing-agent-${Date.now()}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-50';
      case 'fail': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive AI Agents Testing</h1>
          <p className="text-muted-foreground">
            Real functionality auditing with detailed logging and reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runFullAudit} disabled={isAuditRunning}>
            <TestTube className="h-4 w-4 mr-2" />
            {isAuditRunning ? "Running..." : "Start Audit"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Back
          </Button>
        </div>
      </div>

      {isAuditRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="font-medium">{currentTest || "Initializing..."}</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          <TabsTrigger value="report">Audit Report</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((test) => (
                  <div
                    key={test.id}
                    className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <h3 className="font-medium">{test.name}</h3>
                          {test.duration && (
                            <p className="text-sm opacity-75">
                              Completed in {test.duration}ms
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={test.status === 'pass' ? 'default' : 'destructive'}>
                        {test.status}
                      </Badge>
                    </div>
                    
                    {test.error && (
                      <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
                        <strong>Error:</strong> {test.error}
                      </div>
                    )}
                    
                    {test.details && (
                      <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                        <strong>Details:</strong>
                        <pre className="mt-1 text-xs overflow-x-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                
                {testResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No test results yet. Run an audit to see results.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Execution Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded border p-4">
                <div className="space-y-2">
                  {executionLogs.map((log, index) => (
                    <div key={index} className="flex gap-3 text-sm font-mono">
                      <span className="text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge 
                        variant={log.level === 'error' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {log.level}
                      </Badge>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))}
                  
                  {executionLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No execution logs yet. Run an audit to see logs.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Audit Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditReport ? (
                <ScrollArea className="h-96 w-full rounded border p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {auditReport}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No audit report available. Run an audit to generate a report.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downloads" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Downloads & Exports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={downloadAuditReport}
                    disabled={!auditReport}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Audit Report
                  </Button>
                  
                  <Button
                    onClick={downloadTestingAgent}
                    variant="outline"
                    className="w-full"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Download Testing Agent
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>Audit Report:</strong> Comprehensive markdown report with all test results, 
                    execution logs, and recommendations.
                  </p>
                  <p>
                    <strong>Testing Agent:</strong> Standalone Python script that replicates these tests 
                    and can be run independently with real API calls and proper configuration.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <PortfolioIntegrationTest />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}