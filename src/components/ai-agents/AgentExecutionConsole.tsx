import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Terminal,
  PlayCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExecutionLog {
  id: string;
  agent_id: string;
  agent_name?: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  input_data: any;
  output_data?: any;
  error_message?: string;
}

interface StepResult {
  step_id: string;
  status: string;
  output: any;
  error?: string;
  timestamp: string;
}

export function AgentExecutionConsole() {
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ExecutionLog[]>([]);
  const [selectedExecution, setSelectedExecution] =
    useState<ExecutionLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExecutionLogs();

    // Set up real-time subscription for new executions
    const subscription = supabase
      .channel("execution_logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_agent_executions" },
        handleExecutionUpdate,
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterLogs();
  }, [executionLogs, searchTerm, statusFilter]);

  const fetchExecutionLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_agent_executions")
        .select(
          `
          *,
          ai_agents (
            name
          )
        `,
        )
        .order("started_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const logsWithAgentNames = data.map((log) => ({
        ...log,
        agent_name: (log.ai_agents as any)?.name || "Unknown Agent",
        status: log.status as ExecutionLog["status"],
      }));

      setExecutionLogs(logsWithAgentNames);
    } catch (error) {
      console.error("Error fetching execution logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch execution logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutionUpdate = (payload: any) => {
    console.log("Real-time execution update:", payload);
    fetchExecutionLogs(); // Refresh the list
  };

  const filterLogs = () => {
    let filtered = executionLogs;

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((log) => log.status === statusFilter);
    }

    setFilteredLogs(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "running":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-yellow-600 bg-yellow-50";
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const exportLogs = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      total_executions: filteredLogs.length,
      executions: filteredLogs.map((log) => ({
        id: log.id,
        agent_name: log.agent_name,
        status: log.status,
        started_at: log.started_at,
        completed_at: log.completed_at,
        execution_time_ms: log.execution_time_ms,
        input_data: log.input_data,
        output_data: log.output_data,
        error_message: log.error_message,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-execution-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderExecutionDetail = (execution: ExecutionLog) => {
    const stepResults =
      execution.output_data?.step_details ||
      execution.output_data?.step_results ||
      [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">Agent</h4>
            <p className="font-mono text-sm">{execution.agent_name}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">
              Status
            </h4>
            <Badge className={getStatusColor(execution.status)}>
              {execution.status}
            </Badge>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">
              Started
            </h4>
            <p className="font-mono text-xs">
              {new Date(execution.started_at).toLocaleString()}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">
              Duration
            </h4>
            <p className="font-mono text-sm">
              {formatDuration(execution.execution_time_ms)}
            </p>
          </div>
        </div>

        {execution.input_data && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              Input Data
            </h4>
            <ScrollArea className="h-32 w-full rounded border bg-muted p-3">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(execution.input_data, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        )}

        {stepResults.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              Step Results
            </h4>
            <div className="space-y-2">
              {stepResults.map((step: StepResult, index: number) => (
                <div key={index} className="border rounded p-3 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{step.step_id}</span>
                    <Badge
                      variant={
                        step.status === "success" ? "default" : "destructive"
                      }
                    >
                      {step.status}
                    </Badge>
                  </div>

                  {step.output && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        Output:
                      </p>
                      <ScrollArea className="h-20 w-full">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}

                  {step.error && (
                    <div className="mt-2 text-red-600">
                      <p className="text-xs font-medium">Error:</p>
                      <p className="text-xs">{step.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {execution.error_message && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              Error
            </h4>
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-700">{execution.error_message}</p>
            </div>
          </div>
        )}

        {execution.output_data && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">
              Full Output
            </h4>
            <ScrollArea className="h-48 w-full rounded border bg-muted p-3">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(execution.output_data, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Agent Execution Console
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={fetchExecutionLogs}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Execution List</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedExecution}>
              Execution Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search executions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-96 w-full">
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 border rounded cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedExecution?.id === log.id
                        ? "bg-muted border-primary"
                        : ""
                    }`}
                    onClick={() => setSelectedExecution(log)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="font-medium text-sm">
                            {log.agent_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.started_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDuration(log.execution_time_ms)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? "Loading execution logs..."
                      : "No execution logs found"}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details">
            {selectedExecution ? (
              renderExecutionDetail(selectedExecution)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select an execution from the list to view details
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
