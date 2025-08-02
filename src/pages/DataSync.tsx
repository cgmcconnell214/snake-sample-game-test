import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Webhook, Database, Zap, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function DataSync(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreateWebhook = () => {
    navigate('/app/workflow-automation');
  };

  const handleViewLogs = () => {
    navigate('/app/audit-trail');
  };

  const handleSetupFlows = () => {
    navigate('/app/workflow-automation');
  };

  const handleCheckStatus = () => {
    navigate('/app/system-diagnostics');
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Sync & Webhooks</h1>
          <p className="text-muted-foreground">
            Manage data synchronization and API flows
          </p>
        </div>
        <Button onClick={handleCreateWebhook}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Supabase Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor database operations and sync status
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewLogs}>
              View Logs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Zapier / Make API Flows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure automation workflows and integrations
            </p>
            <Button variant="outline" className="w-full" onClick={handleSetupFlows}>
              Setup Flows
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              LLM Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track AI model synchronization and updates
            </p>
            <Button variant="outline" className="w-full" onClick={handleCheckStatus}>
              Check Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
