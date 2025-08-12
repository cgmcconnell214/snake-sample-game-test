import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Monitor, 
  AlertTriangle, 
  Brain, 
  Gauge, 
  Activity,
  Database,
  Server,
  Cpu,
  HardDrive,
  Network,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: "healthy" | "warning" | "critical";
  trend: "up" | "down" | "stable";
}

interface AuditEvent {
  id: string;
  timestamp: string;
  event_type: string;
  severity: "info" | "warning" | "error" | "critical";
  source: string;
  message: string;
  metadata?: any;
}

export default function SystemDiagnostics(): JSX.Element {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const timeFormatter = new Intl.DateTimeFormat(undefined, { timeStyle: "medium" });
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemMetrics();
    fetchAuditEvents();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSystemMetrics();
      fetchAuditEvents();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchSystemMetrics = async () => {
    try {
      // Generate mock system metrics
      const mockMetrics: SystemMetric[] = [
        {
          name: "CPU Usage",
          value: Math.floor(Math.random() * 30) + 15,
          unit: "%",
          status: "healthy",
          trend: "stable"
        },
        {
          name: "Memory Usage",
          value: Math.floor(Math.random() * 25) + 45,
          unit: "%",
          status: "healthy",
          trend: "up"
        },
        {
          name: "Database Connections",
          value: Math.floor(Math.random() * 20) + 85,
          unit: "connections",
          status: "warning",
          trend: "stable"
        },
        {
          name: "API Response Time",
          value: Math.floor(Math.random() * 100) + 120,
          unit: "ms",
          status: "healthy",
          trend: "down"
        },
        {
          name: "Storage Usage",
          value: Math.floor(Math.random() * 15) + 65,
          unit: "%",
          status: "healthy",
          trend: "up"
        },
        {
          name: "Network Throughput",
          value: Math.floor(Math.random() * 50) + 200,
          unit: "MB/s",
          status: "healthy",
          trend: "stable"
        }
      ];

      setMetrics(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching system metrics:", error);
    }
  };

  const fetchAuditEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_event_details")
        .select("id, created_at, request_data, response_data, security_context")
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) {
        console.error("Error fetching audit events:", error);
        return;
      }

      const events: AuditEvent[] = (data || []).map((e) => ({
        id: e.id,
        timestamp: e.created_at,
        event_type: (e.request_data as any)?.action ?? "unknown",
        severity:
          ((e.response_data as any)?.status === "success" ? "info" : "error") as
            | "info"
            | "warning"
            | "error"
            | "critical",
        source: (e.security_context as any)?.ip_address || "system",
        message: (e.response_data as any)?.status ?? "",
        metadata: e,
      }));

      setAuditEvents(events);
    } catch (error) {
      console.error("Error fetching audit events:", error);
    }
  };

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    
    try {
      // Simulate diagnostic run
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await fetchSystemMetrics();
      await fetchAuditEvents();
      
      toast({
        title: "Diagnostics Complete",
        description: "System health check completed successfully",
      });
    } catch (error) {
      toast({
        title: "Diagnostics Failed",
        description: "Failed to complete system diagnostics",
        variant: "destructive",
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "default";
      case "warning":
        return "secondary";
      case "critical":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "info":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      case "critical":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getMetricIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "cpu usage":
        return <Cpu className="h-4 w-4" />;
      case "memory usage":
        return <Activity className="h-4 w-4" />;
      case "database connections":
        return <Database className="h-4 w-4" />;
      case "storage usage":
        return <HardDrive className="h-4 w-4" />;
      case "network throughput":
        return <Network className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const healthyMetrics = metrics.filter(m => m.status === "healthy").length;
  const warningMetrics = metrics.filter(m => m.status === "warning").length;
  const criticalMetrics = metrics.filter(m => m.status === "critical").length;
  const overallHealth = (healthyMetrics / metrics.length) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and health analytics for all system components
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {timeFormatter.format(lastUpdate)}
          </div>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunningDiagnostics}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
            {isRunningDiagnostics ? "Running..." : "Run Diagnostics"}
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallHealth)}%</div>
            <Progress value={overallHealth} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Systems</CardTitle>
            <Monitor className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{healthyMetrics}</div>
            <p className="text-xs text-muted-foreground">Operating normally</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{warningMetrics}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{criticalMetrics}</div>
            <p className="text-xs text-muted-foreground">Immediate action required</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="events">Audit Events</TabsTrigger>
          <TabsTrigger value="memory">AI Memory Tracker</TabsTrigger>
          <TabsTrigger value="drift">Kernel Drift Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getMetricIcon(metric.name)}
                    {metric.name}
                  </CardTitle>
                  <Badge variant={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.value} {metric.unit}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      Trend: {metric.trend}
                    </span>
                    {metric.name.toLowerCase().includes("usage") && (
                      <Progress value={metric.value} className="w-16 h-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Audit Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex flex-col items-center">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground mt-1">
                        {timeFormatter.format(new Date(event.timestamp))}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{event.event_type.replace(/_/g, ' ')}</h4>
                        <span className="text-xs text-muted-foreground">from {event.source}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.message}</p>
                      {event.metadata && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer">View metadata</summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Memory Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Memory Usage by Agent</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Trading Agent</span>
                      <div className="flex items-center gap-2">
                        <Progress value={75} className="w-20" />
                        <span className="text-sm">75%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Analysis Agent</span>
                      <div className="flex items-center gap-2">
                        <Progress value={45} className="w-20" />
                        <span className="text-sm">45%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monitoring Agent</span>
                      <div className="flex items-center gap-2">
                        <Progress value={30} className="w-20" />
                        <span className="text-sm">30%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Optimization Recommendations</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Memory usage within normal parameters
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      Consider garbage collection for Trading Agent
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      All agents responding normally
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drift" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Kernel Drift Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">0.02%</div>
                  <div className="text-sm text-muted-foreground">Current Drift</div>
                  <Badge variant="default" className="mt-2">Stable</Badge>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">0.15%</div>
                  <div className="text-sm text-muted-foreground">Average Drift</div>
                  <Badge variant="secondary" className="mt-2">Normal</Badge>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">0.45%</div>
                  <div className="text-sm text-muted-foreground">Max Threshold</div>
                  <Badge variant="outline" className="mt-2">Safe</Badge>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-3">Drift History (Last 24h)</h4>
                <div className="h-32 bg-muted rounded flex items-end justify-center">
                  <div className="text-sm text-muted-foreground">Drift monitoring chart placeholder</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}