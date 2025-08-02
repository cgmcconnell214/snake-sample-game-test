import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, AlertTriangle, Brain, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function SystemDiagnostics(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRunDiagnostics = () => {
    navigate('/app/audit-trail');
  };

  const handleViewEvents = () => {
    navigate('/app/audit-trail');
  };

  const handleTrackMemory = () => {
    navigate('/app/ai-agents');
  };

  const handleMonitorDrift = () => {
    navigate('/app/admin');
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">
            Monitor system health and performance
          </p>
        </div>
        <Button onClick={handleRunDiagnostics}>
          <Monitor className="h-4 w-4 mr-2" />
          Run Diagnostics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Audit Events (Root)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Deep audit trail of all system events
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewEvents}>
              View Events
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Memory Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor AI agent memory usage and optimization
            </p>
            <Button variant="outline" className="w-full" onClick={handleTrackMemory}>
              Track Memory
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Kernel Drift Watcher
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Detect and monitor system kernel drift
            </p>
            <Button variant="outline" className="w-full" onClick={handleMonitorDrift}>
              Monitor Drift
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
