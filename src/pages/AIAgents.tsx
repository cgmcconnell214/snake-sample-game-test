import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bot,
  Plus,
  TestTube,
  Zap,
  DollarSign,
  MoreVertical,
  Trash2,
  Edit,
  Play,
  Code,
  Download,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { injectContractTemplate } from "@/lib/contractTemplates";
import { WorkflowEditor } from "@/components/ai-agents/WorkflowEditor";
import { AgentDeployment } from "@/components/ai-agents/AgentDeployment";
import { AgentAuditor } from "@/components/ai-agents/AgentAuditor";
import { ComprehensiveTestDashboard } from "@/components/ai-agents/ComprehensiveTestDashboard";
import { EnhancedExecutionConsole } from "@/components/ai-agents/EnhancedExecutionConsole";
import { AgentExecutionAnalyzer } from "@/components/ai-agents/AgentExecutionAnalyzer";
import { z } from "zod";

interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_use: number;
  total_tokens: number;
  tokens_sold: number;
  creator_id: string;
  verification_status: string;
  created_at: string;
  workflow_data: any;
  configuration: any;
  agent_type: string;
  is_active: boolean;
}

const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  agent_type: z.string().min(1, "Agent type is required"),
  price_per_use: z.number().nonnegative("Price must be 0 or more"),
  total_tokens: z.number().int().positive("Total tokens must be positive"),
});

type AgentForm = z.infer<typeof agentSchema>;

export default function AIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [workflowAgent, setWorkflowAgent] = useState<AIAgent | null>(null);
  const [deploymentAgent, setDeploymentAgent] = useState<AIAgent | null>(null);
  const [newAgent, setNewAgent] = useState({
    name: "",
    description: "",
    category: "workflow",
    agent_type: "workflow",
    price_per_use: 0,
    total_tokens: 1000000,
    workflow_data: {},
    configuration: {},
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AgentForm, string>>>({});
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof AgentForm, string>>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAuditMode, setShowAuditMode] = useState(false);
  const [showComprehensiveTest, setShowComprehensiveTest] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    const result = agentSchema.safeParse(newAgent);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        description: fieldErrors.description?.[0],
        category: fieldErrors.category?.[0],
        agent_type: fieldErrors.agent_type?.[0],
        price_per_use: fieldErrors.price_per_use?.[0],
        total_tokens: fieldErrors.total_tokens?.[0],
      });
    } else {
      setErrors({});
    }
  }, [newAgent]);

  useEffect(() => {
    if (!editingAgent) {
      setEditErrors({});
      return;
    }
    const result = agentSchema.safeParse(editingAgent);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setEditErrors({
        name: fieldErrors.name?.[0],
        description: fieldErrors.description?.[0],
        price_per_use: fieldErrors.price_per_use?.[0],
        total_tokens: fieldErrors.total_tokens?.[0],
      });
    } else {
      setEditErrors({});
    }
  }, [editingAgent]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAgents(data || []);
    } catch (error) {
      console.error("Failed to fetch AI agents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch AI agents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    const result = agentSchema.safeParse(newAgent);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        description: fieldErrors.description?.[0],
        category: fieldErrors.category?.[0],
        agent_type: fieldErrors.agent_type?.[0],
        price_per_use: fieldErrors.price_per_use?.[0],
        total_tokens: fieldErrors.total_tokens?.[0],
      });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create an AI agent",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("ai_agents")
        .insert({
          ...newAgent,
          creator_id: user.id,
          configuration: {
            napier_integration: true,
            tokenomics_enabled: true,
            revenue_sharing: true,
            ...newAgent.configuration,
          },
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI agent created successfully",
      });

      setAgents([data, ...agents]);
      setIsCreateModalOpen(false);
      setNewAgent({
        name: "",
        description: "",
        category: "workflow",
        agent_type: "workflow",
        price_per_use: 0,
        total_tokens: 1000000,
        workflow_data: {},
        configuration: {},
      });
    } catch (error) {
      console.error("Failed to create AI agent:", error);
      toast({
        title: "Error",
        description: "Failed to create AI agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }

    toast({
      title: "Success",
      description: "AI agent created successfully",
    });

    setAgents([data, ...agents]);
    setIsCreateModalOpen(false);
    setNewAgent({
      name: "",
      description: "",
      category: "workflow",
      agent_type: "workflow",
      price_per_use: 0,
      total_tokens: 1000000,
      workflow_data: {},
      configuration: {},
    });
    setErrors({});
  };

  const handleCreateTestingAgent = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create an AI agent",
          variant: "destructive",
        });
        return;
      }

    const testingAgentData = {
      name: "Site Functionality Tester",
      description: "Comprehensive agent that tests all major functionality across the app including trading, IP tokenization, learning portal, live classes, and workflow automation.",
      category: "analytics",
      agent_type: "workflow",
      price_per_use: 0,
      total_tokens: 10000000,
      creator_id: user.id,
      workflow_data: {
        steps: [
          {
            id: "trigger-test",
            type: "trigger",
            name: "Site Test Trigger",
            config: {
              trigger_type: "manual",
              description: "Initiates comprehensive site testing"
            }
          },
          {
            id: "test-trading",
            type: "action",
            name: "Test Trading Functions",
            config: {
              action_type: "api_call",
              endpoint: "/api/trading/test",
              description: "Tests order placement, market data retrieval, and portfolio management"
            }
          },
          {
            id: "test-tokenization",
            type: "action",
            name: "Test IP Tokenization",
            config: {
              action_type: "api_call",
              endpoint: "/api/tokenization/test",
              description: "Tests asset creation, token issuance, and staking functionality"
            }
          },
          {
            id: "test-learning",
            type: "action",
            name: "Test Learning Portal",
            config: {
              action_type: "api_call",
              endpoint: "/api/learning/test",
              description: "Tests course creation, enrollment, and progress tracking"
            }
          },
          {
            id: "test-classes",
            type: "action",
            name: "Test Live Classes",
            config: {
              action_type: "api_call",
              endpoint: "/api/classes/test",
              description: "Tests class scheduling, registration, and session management"
            }
          },
          {
            id: "test-escrow",
            type: "action",
            name: "Test Escrow Vaults",
            config: {
              action_type: "api_call",
              endpoint: "/api/escrow/test",
              description: "Tests vault creation, locking, and unlock conditions"
            }
          },
          {
            id: "test-compliance",
            type: "action",
            name: "Test Compliance Systems",
            config: {
              action_type: "api_call",
              endpoint: "/api/compliance/test",
              description: "Tests KYC verification, monitoring, and alert systems"
            }
          },
          {
            id: "notification-results",
            type: "notification",
            name: "Test Results Notification",
            config: {
              message: "Site functionality testing completed successfully!",
              notification_type: "success",
              description: "Sends notification with comprehensive test results"
            }
          },
          {
            id: "generate-report",
            type: "data",
            name: "Generate Test Report",
            config: {
              data_type: "report",
              format: "json",
              description: "Compiles all test results into a comprehensive report"
            }
          }
        ],
        triggers: ["manual"],
        conditions: []
      },
      configuration: {
        test_depth: "comprehensive",
        include_performance: true,
        include_security: true,
        generate_recommendations: true,
        napier_integration: true,
        tokenomics_enabled: true,
        revenue_sharing: false
      }
    };

      const { data, error } = await supabase
        .from("ai_agents")
        .insert(testingAgentData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Testing Agent Created",
        description: "Site Functionality Tester has been created and is ready for deployment.",
      });

      setAgents([data, ...agents]);
    } catch (error) {
      console.error("Failed to create testing agent:", error);
      toast({
        title: "Error",
        description: "Failed to create testing agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("ai_agents")
        .update({ is_active: false })
        .eq("id", agentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI agent deleted successfully",
      });

      setAgents(agents.filter((agent) => agent.id !== agentId));
    } catch (error) {
      console.error("Failed to delete AI agent:", error);
      toast({
        title: "Error",
        description: "Failed to delete AI agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseAgent = async (
    agentId: string,
    tokensToPurchase: number,
  ) => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to purchase an AI agent",
          variant: "destructive",
        });
        return;
      }

      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;

      await injectContractTemplate('rent');

      const totalAmount = tokensToPurchase * agent.price_per_use;

      const { error: purchaseError } = await supabase.from("ai_agent_purchases").insert({
        buyer_id: user.id,
        agent_id: agentId,
        tokens_purchased: tokensToPurchase,
        total_amount: totalAmount,
        payment_status: "completed",
      });

      if (purchaseError) throw purchaseError;

      const { error: updateError } = await supabase
        .from("ai_agents")
        .update({
          tokens_sold: agent.tokens_sold + tokensToPurchase,
        })
        .eq("id", agentId);

      if (updateError) throw updateError;

      toast({
        title: "Purchase Successful",
        description: `Purchased ${tokensToPurchase} tokens for $${totalAmount}`,
      });

      fetchAgents();
    } catch (error) {
      console.error("Failed to purchase AI agent:", error);
      toast({
        title: "Error",
        description: "Failed to purchase AI agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAgent = async (agent: AIAgent) => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase.functions.invoke('execute-ai-agent', {
        body: {
          agentId: agent.id,
          workflowData: agent.workflow_data,
          configuration: agent.configuration,
          inputData: {
            triggered_by: 'manual',
            triggered_at: new Date().toISOString(),
            user_id: user?.id,
          },
        },
      });

      if (error) throw error;

      const result = data?.result || {};
      const stepResults = result.step_results || [];
      const totalSteps = result.total_steps || 0;
      const successfulSteps = result.successful_steps || 0;
      const failedSteps = result.failed_steps || 0;

      toast({
        title: "Agent Executed Successfully",
        description: `${agent.name}: ${successfulSteps}/${totalSteps} steps completed successfully${failedSteps > 0 ? `, ${failedSteps} failed` : ''}`,
      });

      // Log detailed results for debugging
      console.log('Agent execution results:', {
        agent_id: agent.id,
        total_steps: totalSteps,
        successful_steps: successfulSteps,
        failed_steps: failedSteps,
        step_details: stepResults,
      });
    } catch (error: any) {
      console.error('Agent execution error:', error);
      toast({
        title: "Execution Failed",
        description: `Failed to execute ${agent.name}: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUpdateAgent = async (updated: Partial<AIAgent>) => {
    // Get the agent to update - could be editingAgent or workflowAgent
    const agentToUpdate = editingAgent || workflowAgent;
    if (!agentToUpdate) return;

    if (editingAgent) {
      const result = agentSchema.safeParse(editingAgent);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setEditErrors({
          name: fieldErrors.name?.[0],
          description: fieldErrors.description?.[0],
          price_per_use: fieldErrors.price_per_use?.[0],
          total_tokens: fieldErrors.total_tokens?.[0],
        });
        return;
      }
    }

    const { data, error } = await supabase
      .from('ai_agents')
      .update(updated)
      .eq('id', agentToUpdate.id)
      .select()
      .single();

    if (error) {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .update(updated)
        .eq('id', agentToUpdate.id)
        .select()
        .single();

      if (error) throw error;

      console.log('Agent updated successfully:', data);
      setAgents(prev => prev.map(a => (a.id === data.id ? data : a)));
      setEditingAgent(null);
      toast({ title: 'Agent Updated', description: 'Changes saved successfully' });
    } catch (error) {
      console.error('Update error:', error);
      toast({ title: 'Error', description: 'Failed to update agent', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }

    console.log('Agent updated successfully:', data);
    setAgents(prev => prev.map(a => (a.id === data.id ? data : a)));
    setEditingAgent(null);
    setEditErrors({});
    toast({ title: 'Agent Updated', description: 'Changes saved successfully' });
  };

  const isUserAgent = (agent: AIAgent) => {
    // This would check if the current user is the creator
    // For now, we'll just return true to show all options
    return true;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {isLoading && (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {showComprehensiveTest ? (
        <ComprehensiveTestDashboard onClose={() => setShowComprehensiveTest(false)} />
      ) : showAnalytics ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">AI Agent Analytics</h2>
            <Button onClick={() => setShowAnalytics(false)} variant="outline">
              Back to Agents
            </Button>
          </div>
          <AgentExecutionAnalyzer />
        </div>
      ) : showAuditMode ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Basic Audit</h2>
            <Button onClick={() => setShowAuditMode(false)} variant="outline">
              Back to Agents
            </Button>
          </div>
          <AgentAuditor />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">AI Agents Marketplace</h1>
              <p className="text-muted-foreground">
                Discover and deploy tokenized AI workflow automations
              </p>
            </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 w-56">
              <DropdownMenuItem onClick={() => setShowAnalytics(true)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowComprehensiveTest(true)}>
                <TestTube className="h-4 w-4 mr-2" />
                Comprehensive Testing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAuditMode(!showAuditMode)}>
                <TestTube className="h-4 w-4 mr-2" />
                {showAuditMode ? 'Exit Audit' : 'Basic Audit'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateTestingAgent} disabled={isLoading}>
                <Bot className="h-4 w-4 mr-2" />
                Create Testing Agent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCreateModalOpen(true)} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
            <SelectItem value="trading">Trading</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <EnhancedExecutionConsole />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      agent.verification_status === "verified"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {agent.verification_status}
                  </Badge>
                  {isUserAgent(agent) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50 w-48">
                        <DropdownMenuItem onClick={() => setEditingAgent(agent)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setWorkflowAgent(agent)}>
                          <Code className="h-4 w-4 mr-2" />
                          Edit Workflow
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeploymentAgent(agent)}>
                          <Download className="h-4 w-4 mr-2" />
                          Deploy Agent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExecuteAgent(agent)} disabled={isLoading}>
                          <Play className="h-4 w-4 mr-2" />
                          Execute Now
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Agent
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete AI Agent</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{agent.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAgent(agent.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {agent.description}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per use:</span>
                  <span className="font-medium">${agent.price_per_use}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total tokens:</span>
                  <span className="font-medium">
                    {agent.total_tokens.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tokens sold:</span>
                  <span className="font-medium">
                    {agent.tokens_sold.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium">
                    {(agent.total_tokens - agent.tokens_sold).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handlePurchaseAgent(agent.id, 1000)}
                  disabled={agent.total_tokens - agent.tokens_sold < 1000 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Buy 1000 tokens
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state when no agents */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No AI agents found. Be the first to create one!
          </p>
        </div>
      )}

      {/* Create Agent Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create AI Agent</DialogTitle>
            <p className="text-sm text-muted-foreground">Fill in details for the new AI agent.</p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                value={newAgent.name}
                onChange={(e) =>
                  setNewAgent({ ...newAgent, name: e.target.value })
                }
                placeholder="e.g., Trading Bot Extreme"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newAgent.description}
                onChange={(e) =>
                  setNewAgent({ ...newAgent, description: e.target.value })
                }
                placeholder="Describe what your AI agent does..."
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newAgent.category}
                  onValueChange={(value) =>
                    setNewAgent({ ...newAgent, category: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workflow">Workflow Automation</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <Label htmlFor="agent_type">Agent Type</Label>
                <Select
                  value={newAgent.agent_type}
                  onValueChange={(value) =>
                    setNewAgent({ ...newAgent, agent_type: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="ai_assistant">AI Assistant</SelectItem>
                    <SelectItem value="data_processor">Data Processor</SelectItem>
                    <SelectItem value="api_connector">API Connector</SelectItem>
                  </SelectContent>
                </Select>
                {errors.agent_type && (
                  <p className="text-sm text-red-500 mt-1">{errors.agent_type}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price per Use ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newAgent.price_per_use}
                  onChange={(e) =>
                    setNewAgent({
                      ...newAgent,
                      price_per_use: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={isLoading}
                />
                {errors.price_per_use && (
                  <p className="text-sm text-red-500 mt-1">{errors.price_per_use}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tokens">Total Tokens</Label>
                <Input
                  id="tokens"
                  type="number"
                  value={newAgent.total_tokens}
                  onChange={(e) =>
                    setNewAgent({
                      ...newAgent,
                      total_tokens: parseInt(e.target.value) || 1000000,
                    })
                  }
                  disabled={isLoading}
                />
                {errors.total_tokens && (
                  <p className="text-sm text-red-500 mt-1">{errors.total_tokens}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreateAgent}
                className="flex-1"
                disabled={Object.values(errors).some(Boolean)}
              >
                <Zap className="h-4 w-4 mr-2" />
                Create Agent
              <Button onClick={handleCreateAgent} className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Create Agent
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Modal */}
      <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editingAgent?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">Update the properties for this agent.</p>
          </DialogHeader>
          {editingAgent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Agent Name</Label>
                <Input
                  id="edit-name"
                  value={editingAgent.name}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                  disabled={isLoading}
                />
                {editErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{editErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingAgent.description}
                  onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                  disabled={isLoading}
                />
                {editErrors.description && (
                  <p className="text-sm text-red-500 mt-1">{editErrors.description}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-price">Price per Use ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editingAgent.price_per_use}
                  onChange={(e) => setEditingAgent({ ...editingAgent, price_per_use: parseFloat(e.target.value) || 0 })}
                  disabled={isLoading}
                />
                {editErrors.price_per_use && (
                  <p className="text-sm text-red-500 mt-1">{editErrors.price_per_use}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-tokens">Total Tokens</Label>
                <Input
                  id="edit-tokens"
                  type="number"
                  value={editingAgent.total_tokens}
                  onChange={(e) => setEditingAgent({ ...editingAgent, total_tokens: parseInt(e.target.value) || 0 })}
                  disabled={isLoading}
                />
                {editErrors.total_tokens && (
                  <p className="text-sm text-red-500 mt-1">{editErrors.total_tokens}</p>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleUpdateAgent(editingAgent)}
                  className="flex-1"
                  disabled={Object.values(editErrors).some(Boolean)}
                >
                  Save Changes
                <Button onClick={() => handleUpdateAgent(editingAgent)} className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setEditingAgent(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Workflow Editor Modal */}
      {workflowAgent && (
        <WorkflowEditor
          agent={workflowAgent}
          onClose={() => setWorkflowAgent(null)}
          onSave={(workflowData) => {
            handleUpdateAgent({ workflow_data: workflowData });
            setWorkflowAgent(null);
          }}
        />
      )}

      {/* Deployment Modal */}
      {deploymentAgent && (
        <AgentDeployment
          agent={deploymentAgent}
          onClose={() => setDeploymentAgent(null)}
        />
      )}
        </>
      )}
    </div>
  );
}