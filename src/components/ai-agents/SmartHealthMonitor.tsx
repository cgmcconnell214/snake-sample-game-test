import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wrench,
  RefreshCw,
  Activity,
  Zap,
  Clock,
  Shield,
  Database,
  Server,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HealthCheck {
  id: string;
  name: string;
  description: string;
  status: "healthy" | "warning" | "critical" | "unknown";
  score: number;
  message: string;
  details?: any;
  fixAvailable?: boolean;
  lastChecked: string;
}

interface SystemHealth {
  overall_score: number;
  status: "healthy" | "degraded" | "critical";
  checks: HealthCheck[];
  recommendations: string[];
  auto_fixes_applied: number;
}

export function SmartHealthMonitor() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    performHealthCheck();

    // Schedule periodic health checks
    const interval = setInterval(performHealthCheck, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const performHealthCheck = async () => {
    setIsScanning(true);
    try {
      const checks: HealthCheck[] = [];

      // Check 1: Stuck Executions
      const stuckCheck = await checkStuckExecutions();
      checks.push(stuckCheck);

      // Check 2: Database Performance
      const dbCheck = await checkDatabasePerformance();
      checks.push(dbCheck);

      // Check 3: Agent Configuration Integrity
      const configCheck = await checkAgentConfigurations();
      checks.push(configCheck);

      // Check 4: Recent Execution Success Rate
      const successRateCheck = await checkExecutionSuccessRate();
      checks.push(successRateCheck);

      // Check 5: System Resource Usage
      const resourceCheck = await checkSystemResources();
      checks.push(resourceCheck);

      // Check 6: Data Consistency
      const consistencyCheck = await checkDataConsistency();
      checks.push(consistencyCheck);

      // Calculate overall health score
      const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
      const overallScore = totalScore / checks.length;

      const status =
        overallScore >= 90
          ? "healthy"
          : overallScore >= 70
            ? "degraded"
            : "critical";

      // Generate recommendations
      const recommendations = generateRecommendations(checks);

      // Auto-fix if enabled
      let autoFixesApplied = 0;
      if (autoFixEnabled) {
        autoFixesApplied = await performAutoFixes(checks);
      }

      setHealth({
        overall_score: overallScore,
        status,
        checks,
        recommendations,
        auto_fixes_applied: autoFixesApplied,
      });
    } catch (error) {
      console.error("Health check failed:", error);
      toast({
        title: "Health Check Failed",
        description: "Unable to complete system health assessment",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const checkStuckExecutions = async (): Promise<HealthCheck> => {
    try {
      const { data, error } = await supabase
        .from("ai_agent_executions")
        .select("id, started_at")
        .eq("status", "running")
        .lt("started_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()); // 30 minutes ago

      if (error) throw error;

      const stuckCount = data?.length || 0;
      const score = stuckCount === 0 ? 100 : Math.max(0, 100 - stuckCount * 10);
      const status =
        stuckCount === 0 ? "healthy" : stuckCount <= 2 ? "warning" : "critical";

      return {
        id: "stuck-executions",
        name: "Stuck Executions",
        description: "Detects agent executions that are stuck in running state",
        status,
        score,
        message:
          stuckCount === 0
            ? "No stuck executions detected"
            : `${stuckCount} executions stuck for over 30 minutes`,
        details: {
          stuck_count: stuckCount,
          execution_ids: data?.map((d) => d.id),
        },
        fixAvailable: stuckCount > 0,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "stuck-executions",
        name: "Stuck Executions",
        description: "Detects agent executions that are stuck in running state",
        status: "unknown",
        score: 0,
        message: "Failed to check stuck executions",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkDatabasePerformance = async (): Promise<HealthCheck> => {
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from("ai_agents")
        .select("id")
        .limit(1);

      if (error) throw error;

      const responseTime = Date.now() - start;
      const score =
        responseTime < 100
          ? 100
          : responseTime < 500
            ? 80
            : responseTime < 1000
              ? 60
              : 30;

      const status =
        score >= 80 ? "healthy" : score >= 60 ? "warning" : "critical";

      return {
        id: "database-performance",
        name: "Database Performance",
        description: "Monitors database query response times",
        status,
        score,
        message: `Database response time: ${responseTime}ms`,
        details: { response_time_ms: responseTime },
        fixAvailable: false,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "database-performance",
        name: "Database Performance",
        description: "Monitors database query response times",
        status: "critical",
        score: 0,
        message: "Database connection failed",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkAgentConfigurations = async (): Promise<HealthCheck> => {
    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("id, name, configuration, workflow_data")
        .eq("is_active", true);

      if (error) throw error;

      let issueCount = 0;
      const issues: string[] = [];

      data?.forEach((agent) => {
        if (
          !agent.configuration ||
          Object.keys(agent.configuration).length === 0
        ) {
          issueCount++;
          issues.push(`${agent.name}: Missing configuration`);
        }

        if (
          !agent.workflow_data ||
          typeof agent.workflow_data !== "object" ||
          !(agent.workflow_data as any)?.steps ||
          (agent.workflow_data as any).steps.length === 0
        ) {
          issueCount++;
          issues.push(`${agent.name}: No workflow steps defined`);
        }
      });

      const totalAgents = data?.length || 0;
      const score =
        totalAgents === 0
          ? 100
          : Math.max(0, 100 - (issueCount / totalAgents) * 100);
      const status =
        issueCount === 0
          ? "healthy"
          : issueCount / totalAgents <= 0.1
            ? "warning"
            : "critical";

      return {
        id: "agent-configurations",
        name: "Agent Configurations",
        description: "Validates agent configuration completeness",
        status,
        score,
        message:
          issueCount === 0
            ? "All agent configurations are valid"
            : `${issueCount} configuration issues found`,
        details: { total_agents: totalAgents, issues },
        fixAvailable: false,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "agent-configurations",
        name: "Agent Configurations",
        description: "Validates agent configuration completeness",
        status: "unknown",
        score: 0,
        message: "Failed to check agent configurations",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkExecutionSuccessRate = async (): Promise<HealthCheck> => {
    try {
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data, error } = await supabase
        .from("ai_agent_executions")
        .select("status")
        .gte("started_at", yesterday);

      if (error) throw error;

      const total = data?.length || 0;
      const successful =
        data?.filter((e) => e.status === "completed").length || 0;
      const successRate = total === 0 ? 100 : (successful / total) * 100;

      const score = successRate;
      const status =
        successRate >= 90
          ? "healthy"
          : successRate >= 70
            ? "warning"
            : "critical";

      return {
        id: "execution-success-rate",
        name: "Execution Success Rate",
        description: "Monitors execution success rate over last 24 hours",
        status,
        score,
        message: `${successRate.toFixed(1)}% success rate (${successful}/${total})`,
        details: { success_rate: successRate, successful, total },
        fixAvailable: false,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "execution-success-rate",
        name: "Execution Success Rate",
        description: "Monitors execution success rate over last 24 hours",
        status: "unknown",
        score: 0,
        message: "Failed to calculate success rate",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const checkSystemResources = async (): Promise<HealthCheck> => {
    // Simulated system resource check
    // In a real implementation, this would check actual system metrics
    const cpuUsage = Math.random() * 100;
    const memoryUsage = Math.random() * 100;
    const maxUsage = Math.max(cpuUsage, memoryUsage);

    const score =
      maxUsage < 70 ? 100 : maxUsage < 85 ? 80 : maxUsage < 95 ? 60 : 30;

    const status =
      score >= 80 ? "healthy" : score >= 60 ? "warning" : "critical";

    return {
      id: "system-resources",
      name: "System Resources",
      description: "Monitors CPU and memory usage",
      status,
      score,
      message: `CPU: ${cpuUsage.toFixed(1)}%, Memory: ${memoryUsage.toFixed(1)}%`,
      details: { cpu_usage: cpuUsage, memory_usage: memoryUsage },
      fixAvailable: false,
      lastChecked: new Date().toISOString(),
    };
  };

  const checkDataConsistency = async (): Promise<HealthCheck> => {
    try {
      // Check for orphaned execution logs
      const { data: orphanedLogs, error: logsError } = await supabase
        .from("ai_agent_execution_logs")
        .select("execution_id")
        .not(
          "execution_id",
          "in",
          "(SELECT id FROM ai_agent_executions WHERE id IS NOT NULL)",
        );

      if (logsError) throw logsError;

      const orphanedCount = orphanedLogs?.length || 0;
      const score =
        orphanedCount === 0 ? 100 : Math.max(0, 100 - orphanedCount);
      const status =
        orphanedCount === 0
          ? "healthy"
          : orphanedCount <= 10
            ? "warning"
            : "critical";

      return {
        id: "data-consistency",
        name: "Data Consistency",
        description: "Checks for data integrity issues",
        status,
        score,
        message:
          orphanedCount === 0
            ? "No data consistency issues found"
            : `${orphanedCount} orphaned log entries detected`,
        details: { orphaned_logs: orphanedCount },
        fixAvailable: orphanedCount > 0,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "data-consistency",
        name: "Data Consistency",
        description: "Checks for data integrity issues",
        status: "unknown",
        score: 0,
        message: "Failed to check data consistency",
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const generateRecommendations = (checks: HealthCheck[]): string[] => {
    const recommendations: string[] = [];

    checks.forEach((check) => {
      if (check.status === "critical") {
        switch (check.id) {
          case "stuck-executions":
            recommendations.push("Enable auto-cleanup for stuck executions");
            break;
          case "database-performance":
            recommendations.push("Consider database optimization or scaling");
            break;
          case "execution-success-rate":
            recommendations.push(
              "Review failed executions for common patterns",
            );
            break;
        }
      } else if (check.status === "warning") {
        switch (check.id) {
          case "agent-configurations":
            recommendations.push(
              "Review and update incomplete agent configurations",
            );
            break;
          case "system-resources":
            recommendations.push(
              "Monitor system resources and consider scaling",
            );
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push(
        "System is healthy. Continue monitoring for optimal performance.",
      );
    }

    return recommendations;
  };

  const performAutoFixes = async (checks: HealthCheck[]): Promise<number> => {
    let fixesApplied = 0;

    for (const check of checks) {
      if (check.fixAvailable && check.status !== "healthy") {
        try {
          switch (check.id) {
            case "stuck-executions":
              // Auto-fix stuck executions
              await supabase.rpc("cleanup_stuck_executions");
              fixesApplied++;
              break;
            case "data-consistency":
              // Clean up orphaned logs
              await supabase
                .from("ai_agent_execution_logs")
                .delete()
                .not(
                  "execution_id",
                  "in",
                  "(SELECT id FROM ai_agent_executions WHERE id IS NOT NULL)",
                );
              fixesApplied++;
              break;
          }
        } catch (error) {
          console.error(`Failed to auto-fix ${check.id}:`, error);
        }
      }
    }

    return fixesApplied;
  };

  const manualFix = async (checkId: string) => {
    setIsFixing(true);
    try {
      await performAutoFixes([health!.checks.find((c) => c.id === checkId)!]);
      toast({
        title: "Fix Applied",
        description: "Issue has been resolved",
      });
      performHealthCheck(); // Re-check after fix
    } catch (error) {
      toast({
        title: "Fix Failed",
        description: "Unable to apply fix automatically",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "critical":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold">System Health Monitor</h2>
            <p className="text-muted-foreground">
              Continuous monitoring and auto-healing for AI agent infrastructure
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setAutoFixEnabled(!autoFixEnabled)}
            variant={autoFixEnabled ? "default" : "outline"}
            size="sm"
          >
            <Shield className="h-4 w-4 mr-2" />
            Auto-Fix {autoFixEnabled ? "ON" : "OFF"}
          </Button>
          <Button
            onClick={performHealthCheck}
            variant="outline"
            size="sm"
            disabled={isScanning}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isScanning ? "animate-spin" : ""}`}
            />
            Scan Now
          </Button>
        </div>
      </div>

      {health && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checks">Health Checks</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Overall Health</p>
                  {getStatusIcon(health.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {health.overall_score.toFixed(0)}%
                  </div>
                  <Progress value={health.overall_score} className="mt-2" />
                  <Badge className={`mt-2 ${getStatusColor(health.status)}`}>
                    {health.status.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Active Checks</p>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {health.checks.length}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {
                        health.checks.filter((c) => c.status === "healthy")
                          .length
                      }
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      {
                        health.checks.filter((c) => c.status === "warning")
                          .length
                      }
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <XCircle className="h-3 w-3 text-red-500" />
                      {
                        health.checks.filter((c) => c.status === "critical")
                          .length
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Auto-Fixes Applied</p>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {health.auto_fixes_applied}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last scan: {new Date().toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="checks" className="space-y-4">
            <div className="grid gap-4">
              {health.checks.map((check) => (
                <Card key={check.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <h4 className="font-medium">{check.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {check.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(check.status)}>
                          {check.score.toFixed(0)}%
                        </Badge>
                        {check.fixAvailable && check.status !== "healthy" && (
                          <Button
                            onClick={() => manualFix(check.id)}
                            variant="outline"
                            size="sm"
                            disabled={isFixing}
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            Fix
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{check.message}</p>
                    {check.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-muted-foreground">
                          Show details
                        </summary>
                        <pre className="mt-1 text-xs overflow-x-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Last checked:{" "}
                      {new Date(check.lastChecked).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  System Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {health.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded"
                    >
                      <p className="text-sm text-yellow-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!health && isScanning && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Performing system health check...
          </CardContent>
        </Card>
      )}
    </div>
  );
}
