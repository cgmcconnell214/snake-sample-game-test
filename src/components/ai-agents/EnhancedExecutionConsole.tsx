import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Terminal,
  RefreshCw,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Database,
  Code,
  AlertTriangle,
} from "lucide-react";
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

interface BackendLog {
  id: string;
  execution_id: string;
  agent_id: string;
  log_level: "debug" | "info" | "warn" | "error";
  message: string;
  step_id?: string;
  step_name?: string;
  data: any;
  timestamp: string;
}

export function EnhancedExecutionConsole() {
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [backendLogs, setBackendLogs] = useState<BackendLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ExecutionLog[]>([]);
  const [filteredBackendLogs, setFilteredBackendLogs] = useState<BackendLog[]>(
    [],
  );
  const [selectedExecution, setSelectedExecution] =
    useState<ExecutionLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [logLevelFilter, setLogLevelFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExecutionLogs();
    fetchBackendLogs();

    // Set up real-time subscription for executions
    const executionSubscription = supabase
      .channel("execution_logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_agent_executions" },
        handleExecutionUpdate,
      )
      .subscribe();

    // Set up real-time subscription for backend logs
    const backendSubscription = supabase
      .channel("backend_logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_agent_execution_logs" },
        handleBackendLogUpdate,
      )
      .subscribe();

    return () => {
      executionSubscription.unsubscribe();
      backendSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterLogs();
  }, [executionLogs, searchTerm, statusFilter]);

  useEffect(() => {
    filterBackendLogs();
  }, [backendLogs, searchTerm, logLevelFilter, selectedExecution]);

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

  const fetchBackendLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_agent_execution_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(500);

      if (error) throw error;
      setBackendLogs(
        (data || []).map((log) => ({
          ...log,
          log_level: log.log_level as BackendLog["log_level"],
        })),
      );
    } catch (error) {
      console.error("Error fetching backend logs:", error);
    }
  };

  const handleExecutionUpdate = () => {
    fetchExecutionLogs();
  };

  const handleBackendLogUpdate = () => {
    fetchBackendLogs();
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

  const filterBackendLogs = () => {
    let filtered = backendLogs;

    if (selectedExecution) {
      filtered = filtered.filter(
        (log) => log.execution_id === selectedExecution.id,
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.step_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (logLevelFilter !== "all") {
      filtered = filtered.filter((log) => log.log_level === logLevelFilter);
    }

    setFilteredBackendLogs(filtered);
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

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <XCircle className="h-3 w-3 text-red-500" />;
      case "warn":
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case "info":
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case "debug":
        return <Code className="h-3 w-3 text-gray-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
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

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-600 bg-red-50";
      case "warn":
        return "text-yellow-600 bg-yellow-50";
      case "info":
        return "text-blue-600 bg-blue-50";
      case "debug":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
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
      executions: filteredLogs,
      backend_logs: filteredBackendLogs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-agent-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cleanupStuck = async () => {
    try {
      await supabase.rpc("cleanup_stuck_executions");
      toast({
        title: "Cleanup triggered",
        description: "Stuck executions marked as failed.",
      });
      fetchExecutionLogs();
      fetchBackendLogs();
    } catch (error) {
      console.error("Cleanup error:", error);
      toast({
        title: "Cleanup failed",
        description: "Could not cleanup stuck executions",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Enhanced Execution Console
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={cleanupStuck} variant="outline" size="sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Clean stuck
            </Button>
            <Button
              onClick={() => {
                fetchExecutionLogs();
                fetchBackendLogs();
              }}
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
        <Tabs defaultValue="executions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="executions">Executions</TabsTrigger>
            <TabsTrigger value="backend-logs">Backend Logs</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedExecution}>
              Execution Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executions" className="space-y-4">
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

          <TabsContent value="backend-logs" className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search backend logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={logLevelFilter}
                  onValueChange={setLogLevelFilter}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={logLevelFilter === "info" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setLogLevelFilter(
                      logLevelFilter === "info" ? "all" : "info",
                    )
                  }
                >
                  Info
                </Button>
                <Button
                  variant={logLevelFilter === "debug" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setLogLevelFilter(
                      logLevelFilter === "debug" ? "all" : "debug",
                    )
                  }
                >
                  Debug
                </Button>
              </div>
            </div>

            <ScrollArea className="h-96 w-full">
              <div className="space-y-2 font-mono text-sm">
                {filteredBackendLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 border rounded ${getLogLevelColor(log.log_level)} border-l-4`}
                  >
                    <div className="flex items-start gap-2">
                      {getLogLevelIcon(log.log_level)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          {log.step_name && (
                            <Badge variant="outline" className="text-xs">
                              {log.step_name}
                            </Badge>
                          )}
                          <Badge
                            className={
                              getLogLevelColor(log.log_level) +
                              " cursor-pointer"
                            }
                            onClick={() => setLogLevelFilter(log.log_level)}
                            title={`Filter by ${log.log_level}`}
                          >
                            {log.log_level.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm">{log.message}</p>
                        {log.data && Object.keys(log.data).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-muted-foreground">
                              Show data
                            </summary>
                            <pre className="mt-1 text-xs overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredBackendLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {selectedExecution
                      ? "No backend logs for this execution"
                      : "Select an execution to view backend logs"}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details">
            {selectedExecution ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Agent
                    </h4>
                    <p className="font-mono text-sm">
                      {selectedExecution.agent_name}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Status
                    </h4>
                    <Badge className={getStatusColor(selectedExecution.status)}>
                      {selectedExecution.status}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Started
                    </h4>
                    <p className="font-mono text-xs">
                      {new Date(selectedExecution.started_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Duration
                    </h4>
                    <p className="font-mono text-sm">
                      {formatDuration(selectedExecution.execution_time_ms)}
                    </p>
                  </div>
                </div>

                {selectedExecution.output_data && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      Output Data
                    </h4>
                    <ScrollArea className="h-48 w-full rounded border bg-muted p-3">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(selectedExecution.output_data, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {selectedExecution.error_message && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      Error
                    </h4>
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700">
                        {selectedExecution.error_message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
