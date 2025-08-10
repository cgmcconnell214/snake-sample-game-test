import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Webhook, Database, Zap, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function DataSync(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

  const handleStartSync = async () => {
    setError(null);
    setIsSyncing(true);
    setProgress(0);

    const { error: startError } = await supabase.functions.invoke('trigger-sync');

    if (startError) {
      setIsSyncing(false);
      setError(startError.message);
      toast({
        title: 'Failed to start sync',
        description: startError.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('sync_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sync_events' },
        (payload) => {
          const status = (payload.new as any)?.status;
          if (status === 'in_progress') {
            setIsSyncing(true);
            setProgress((payload.new as any)?.progress || 0);
          } else if (status === 'completed') {
            setIsSyncing(false);
            setProgress(100);
            toast({ title: 'Sync complete' });
          } else if (status === 'failed') {
            setIsSyncing(false);
            const err = (payload.new as any)?.error || 'Unknown error';
            setError(err);
            toast({ title: 'Sync failed', description: err, variant: 'destructive' });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  useEffect(() => {
    if (!isSyncing) return;

    const interval = setInterval(async () => {
      const { data, error: statusError } = await supabase
        .from('sync_events')
        .select('status, progress, error')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (statusError) {
        setIsSyncing(false);
        setError(statusError.message);
        toast({
          title: 'Sync status error',
          description: statusError.message,
          variant: 'destructive',
        });
        clearInterval(interval);
        return;
      }

      if (!data) return;

      if (data.status === 'in_progress') {
        setProgress(data.progress || 0);
      } else if (data.status === 'completed') {
        setIsSyncing(false);
        setProgress(100);
        toast({ title: 'Sync complete' });
        clearInterval(interval);
      } else if (data.status === 'failed') {
        setIsSyncing(false);
        const err = data.error || 'Unknown error';
        setError(err);
        toast({ title: 'Sync failed', description: err, variant: 'destructive' });
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isSyncing, toast]);
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Sync & Webhooks</h1>
          <p className="text-muted-foreground">
            Manage data synchronization and API flows
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleStartSync} disabled={isSyncing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button onClick={handleCreateWebhook}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Create Webhook
          </Button>
        </div>
      </div>

      {isSyncing && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">Syncing... {progress}%</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">Sync failed: {error}</p>
      )}

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
