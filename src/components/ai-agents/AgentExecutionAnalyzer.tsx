import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Activity,
  Database
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExecutionMetrics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  failureRate: number;
  executionsByStatus: {
    completed: number;
    failed: number;
    running: number;
  };
  executionsByAgent: Array<{
    agent_id: string;
    agent_name: string;
    count: number;
    success_rate: number;
  }>;
  performanceTrend: Array<{
    date: string;
    executions: number;
    avg_time: number;
  }>;
}

export function AgentExecutionAnalyzer() {
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null);
  const [dateRange, setDateRange] = useState(7); // days
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    analyzeExecutions();
  }, [dateRange]);

  const analyzeExecutions = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - dateRange);

      // Fetch execution data
      const { data: executions, error } = await supabase
        .from('ai_agent_executions')
        .select(`
          *,
          ai_agents (
            name
          )
        `)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;

      const executionsWithAgentNames = executions.map(exec => ({
        ...exec,
        agent_name: (exec.ai_agents as any)?.name || 'Unknown Agent'
      }));

      // Calculate metrics
      const totalExecutions = executionsWithAgentNames.length;
      const completedExecutions = executionsWithAgentNames.filter(e => e.status === 'completed');
      const failedExecutions = executionsWithAgentNames.filter(e => e.status === 'failed');
      const runningExecutions = executionsWithAgentNames.filter(e => e.status === 'running');

      const successRate = totalExecutions > 0 ? (completedExecutions.length / totalExecutions) * 100 : 0;
      const failureRate = totalExecutions > 0 ? (failedExecutions.length / totalExecutions) * 100 : 0;

      // Calculate average execution time
      const completedWithTime = completedExecutions.filter(e => e.execution_time_ms);
      const averageExecutionTime = completedWithTime.length > 0 
        ? completedWithTime.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / completedWithTime.length 
        : 0;

      // Group by agent
      const agentGroups = executionsWithAgentNames.reduce((acc, exec) => {
        const key = exec.agent_id;
        if (!acc[key]) {
          acc[key] = {
            agent_id: exec.agent_id,
            agent_name: exec.agent_name,
            executions: [],
          };
        }
        acc[key].executions.push(exec);
        return acc;
      }, {} as Record<string, any>);

      const executionsByAgent = Object.values(agentGroups).map((group: any) => {
        const total = group.executions.length;
        const successful = group.executions.filter((e: any) => e.status === 'completed').length;
        return {
          agent_id: group.agent_id,
          agent_name: group.agent_name,
          count: total,
          success_rate: total > 0 ? (successful / total) * 100 : 0,
        };
      });

      // Performance trend by day
      const dayGroups = executionsWithAgentNames.reduce((acc, exec) => {
        const date = new Date(exec.started_at).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(exec);
        return acc;
      }, {} as Record<string, any[]>);

      const performanceTrend = Object.entries(dayGroups).map(([date, execs]) => {
        const completedExecs = execs.filter(e => e.status === 'completed' && e.execution_time_ms);
        const avgTime = completedExecs.length > 0 
          ? completedExecs.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / completedExecs.length 
          : 0;
        return {
          date,
          executions: execs.length,
          avg_time: avgTime,
        };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setMetrics({
        totalExecutions,
        successRate,
        averageExecutionTime,
        failureRate,
        executionsByStatus: {
          completed: completedExecutions.length,
          failed: failedExecutions.length,
          running: runningExecutions.length,
        },
        executionsByAgent,
        performanceTrend,
      });

    } catch (error) {
      console.error('Error analyzing executions:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze execution data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalysis = () => {
    if (!metrics) return;

    const analysisData = {
      timestamp: new Date().toISOString(),
      date_range_days: dateRange,
      summary: {
        total_executions: metrics.totalExecutions,
        success_rate: metrics.successRate,
        failure_rate: metrics.failureRate,
        average_execution_time_ms: metrics.averageExecutionTime,
      },
      breakdown_by_status: metrics.executionsByStatus,
      agent_performance: metrics.executionsByAgent,
      daily_trend: metrics.performanceTrend,
      recommendations: generateRecommendations(metrics),
    };

    const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateRecommendations = (metrics: ExecutionMetrics): string[] => {
    const recommendations = [];

    if (metrics.successRate < 80) {
      recommendations.push("Success rate is below 80%. Review failed executions for common patterns.");
    }

    if (metrics.averageExecutionTime > 30000) {
      recommendations.push("Average execution time is high (>30s). Consider optimizing workflow steps.");
    }

    if (metrics.executionsByStatus.running > metrics.totalExecutions * 0.1) {
      recommendations.push("High number of stuck executions. Consider implementing auto-cleanup.");
    }

    const lowPerformingAgents = metrics.executionsByAgent.filter(a => a.success_rate < 70);
    if (lowPerformingAgents.length > 0) {
      recommendations.push(`${lowPerformingAgents.length} agents have success rates below 70%. Review their configurations.`);
    }

    if (recommendations.length === 0) {
      recommendations.push("All metrics look healthy. Continue monitoring for trends.");
    }

    return recommendations;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Execution Analytics</h2>
          <p className="text-muted-foreground">
            Performance analysis and insights for AI agent executions
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-3 py-1 border rounded"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={exportAnalysis} variant="outline" size="sm" disabled={!metrics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={analyzeExecutions} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Analyzing execution data...
          </CardContent>
        </Card>
      ) : metrics ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">By Agent</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Total Executions</p>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalExecutions}</div>
                  <p className="text-xs text-muted-foreground">
                    Last {dateRange} days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Success Rate</p>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.successRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.executionsByStatus.completed} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Avg. Execution Time</p>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatTime(metrics.averageExecutionTime)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Completed executions only
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Failure Rate</p>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {metrics.failureRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.executionsByStatus.failed} failed
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Execution Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.executionsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'completed' ? 'bg-green-500' :
                          status === 'failed' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`} />
                        <span className="capitalize">{status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({((count / metrics.totalExecutions) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance by Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.executionsByAgent.map((agent) => (
                    <div key={agent.agent_id} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{agent.agent_name}</h4>
                        <Badge variant={agent.success_rate >= 80 ? 'default' : 'destructive'}>
                          {agent.success_rate.toFixed(1)}% success
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{agent.count} executions</span>
                        <span>ID: {agent.agent_id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Execution Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.performanceTrend.map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm font-medium">{day.date}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{day.executions} executions</span>
                        <span>Avg: {formatTime(day.avg_time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generateRecommendations(metrics).map((rec, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No execution data available for analysis</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}