import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Cloud, 
  Download, 
  Copy, 
  ExternalLink,
  Server,
  Globe,
  Code,
  Settings,
  Activity,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentDeploymentProps {
  agent: any;
  onClose: () => void;
}

export function AgentDeployment({ agent, onClose }: AgentDeploymentProps) {
  const [deploymentConfig, setDeploymentConfig] = useState({
    environment: "staging",
    scaling: "auto",
    timeout: 30,
    memory: "256MB",
    cpu: "0.5",
    env_vars: {},
    webhook_url: "",
    api_enabled: true,
    monitoring_enabled: true,
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<"idle" | "deploying" | "success" | "error">("idle");
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const { toast } = useToast();

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentStatus("deploying");

    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const generatedUrl = `https://agent-${agent.id.slice(0, 8)}.agents.platform.com`;
      setDeploymentUrl(generatedUrl);
      setDeploymentStatus("success");
      
      toast({
        title: "Deployment Successful",
        description: `Agent deployed to ${generatedUrl}`,
      });
    } catch (error) {
      setDeploymentStatus("error");
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "URL copied to clipboard",
    });
  };

  const generateAPICode = () => {
    return `// Example API usage
const response = await fetch('${deploymentUrl || 'https://your-agent-url.com'}/api/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    input: "your input data",
    parameters: {
      // workflow parameters
    }
  })
});

const result = await response.json();
console.log(result);`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Deploy Agent - {agent.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="config" className="h-[70vh]">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 h-[calc(100%-40px)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Environment Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="environment">Environment</Label>
                      <Select
                        value={deploymentConfig.environment}
                        onValueChange={(value) => 
                          setDeploymentConfig({ ...deploymentConfig, environment: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="scaling">Scaling Strategy</Label>
                      <Select
                        value={deploymentConfig.scaling}
                        onValueChange={(value) => 
                          setDeploymentConfig({ ...deploymentConfig, scaling: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="auto">Auto Scaling</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="timeout">Timeout (seconds)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={deploymentConfig.timeout}
                        onChange={(e) => 
                          setDeploymentConfig({ 
                            ...deploymentConfig, 
                            timeout: parseInt(e.target.value) || 30 
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="api-enabled">API Access</Label>
                      <Switch
                        id="api-enabled"
                        checked={deploymentConfig.api_enabled}
                        onCheckedChange={(checked) => 
                          setDeploymentConfig({ ...deploymentConfig, api_enabled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="monitoring-enabled">Monitoring</Label>
                      <Switch
                        id="monitoring-enabled"
                        checked={deploymentConfig.monitoring_enabled}
                        onCheckedChange={(checked) => 
                          setDeploymentConfig({ ...deploymentConfig, monitoring_enabled: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Resource Allocation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="memory">Memory</Label>
                      <Select
                        value={deploymentConfig.memory}
                        onValueChange={(value) => 
                          setDeploymentConfig({ ...deploymentConfig, memory: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="128MB">128MB</SelectItem>
                          <SelectItem value="256MB">256MB</SelectItem>
                          <SelectItem value="512MB">512MB</SelectItem>
                          <SelectItem value="1GB">1GB</SelectItem>
                          <SelectItem value="2GB">2GB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cpu">CPU</Label>
                      <Select
                        value={deploymentConfig.cpu}
                        onValueChange={(value) => 
                          setDeploymentConfig({ ...deploymentConfig, cpu: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.25">0.25 CPU</SelectItem>
                          <SelectItem value="0.5">0.5 CPU</SelectItem>
                          <SelectItem value="1">1 CPU</SelectItem>
                          <SelectItem value="2">2 CPU</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Webhooks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input
                        id="webhook-url"
                        value={deploymentConfig.webhook_url}
                        onChange={(e) => 
                          setDeploymentConfig({ ...deploymentConfig, webhook_url: e.target.value })
                        }
                        placeholder="https://your-app.com/webhook"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deploy" className="space-y-4 h-[calc(100%-40px)] overflow-y-auto">
            <div className="text-center space-y-6">
              {deploymentStatus === "idle" && (
                <>
                  <div className="max-w-md mx-auto">
                    <Server className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Deploy</h3>
                    <p className="text-muted-foreground mb-6">
                      Your agent is configured and ready for deployment. Click deploy to launch it.
                    </p>
                  </div>
                  
                  <Card className="max-w-md mx-auto">
                    <CardContent className="pt-6">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Environment:</span>
                          <Badge variant="outline">{deploymentConfig.environment}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Memory:</span>
                          <span>{deploymentConfig.memory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CPU:</span>
                          <span>{deploymentConfig.cpu}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>API Enabled:</span>
                          <span>{deploymentConfig.api_enabled ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button 
                    onClick={handleDeploy} 
                    disabled={isDeploying}
                    size="lg"
                    className="w-full max-w-md"
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    Deploy Agent
                  </Button>
                </>
              )}

              {deploymentStatus === "deploying" && (
                <div className="max-w-md mx-auto">
                  <div className="animate-spin h-16 w-16 mx-auto border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Deploying Agent</h3>
                  <p className="text-muted-foreground">
                    Setting up your agent infrastructure...
                  </p>
                </div>
              )}

              {deploymentStatus === "success" && (
                <div className="max-w-md mx-auto">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Deployment Successful!</h3>
                  <p className="text-muted-foreground mb-6">
                    Your agent is now live and ready to use.
                  </p>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="h-4 w-4" />
                        <span className="font-medium">Agent URL:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input value={deploymentUrl} readOnly className="flex-1" />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(deploymentUrl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(deploymentUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {deploymentStatus === "error" && (
                <div className="max-w-md mx-auto">
                  <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Deployment Failed</h3>
                  <p className="text-muted-foreground mb-6">
                    There was an error deploying your agent. Please try again.
                  </p>
                  <Button onClick={handleDeploy} variant="outline">
                    Retry Deployment
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-4 h-[calc(100%-40px)] overflow-y-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    API Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>API Endpoint</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={deploymentUrl ? `${deploymentUrl}/api/execute` : "Deploy agent to get API URL"} 
                        readOnly 
                        className="flex-1"
                      />
                      {deploymentUrl && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(`${deploymentUrl}/api/execute`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Example Code</Label>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        <code>{generateAPICode()}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(generateAPICode())}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use your agent's API key to authenticate requests. You can find your API key in the agent settings.
                  </p>
                  <Button variant="outline">
                    Generate API Key
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4 h-[calc(100%-40px)] overflow-y-auto">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Executions</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">0ms</div>
                      <div className="text-sm text-muted-foreground">Avg Response</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">99.9%</div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2 text-sm">
                      <div className="text-muted-foreground">
                        No logs available yet. Deploy your agent to see logs.
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}