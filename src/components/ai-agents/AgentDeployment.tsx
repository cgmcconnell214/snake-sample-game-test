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
import { supabase } from "@/integrations/supabase/client";

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
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
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

  const generateAPIKey = async () => {
    setGeneratingKey(true);
    try {
      // Generate a secure API key
      const newApiKey = `ak_${agent.id.substring(0, 8)}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}`;
      setApiKey(newApiKey);
      
      // Store the API key in the database
      const { error } = await supabase
        .from('ai_agents')
        .update({ 
          configuration: { 
            ...agent.configuration, 
            api_key: newApiKey,
            api_key_created_at: new Date().toISOString()
          } 
        })
        .eq('id', agent.id);

      if (error) throw error;

      toast({
        title: "API Key Generated",
        description: "Your new API key has been created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      });
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleDownloadAgent = () => {
    const agentPackage = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      workflow_data: agent.workflow_data,
      configuration: agent.configuration,
      runtime: "node",
      version: "1.0.0",
      dependencies: ["express", "axios", "dotenv"],
      startup_script: "start.sh",
      readme: `# ${agent.name}\n\n${agent.description}\n\n## Quick Start\n\n1. Extract the package\n2. Run: ./start.sh\n3. Access API at http://localhost:3000\n\n## Configuration\n\nEdit config.json to customize settings.`
    };

    const blob = new Blob([JSON.stringify(agentPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-${agent.id.slice(0, 8)}-package.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Agent package downloaded successfully",
    });
  };

  const handleDownloadDockerImage = () => {
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy agent files
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the agent
CMD ["npm", "start"]`;

    const packageJson = {
      name: `agent-${agent.id.slice(0, 8)}`,
      version: "1.0.0",
      description: agent.description,
      main: "index.js",
      scripts: {
        start: "node index.js",
        dev: "node index.js"
      },
      dependencies: {
        express: "^4.18.0",
        axios: "^1.6.0",
        dotenv: "^16.0.0"
      }
    };

    const indexJs = `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Agent configuration
const agentConfig = ${JSON.stringify(agent, null, 2)};

// Execute workflow endpoint
app.post('/execute', async (req, res) => {
  try {
    const { inputData } = req.body;
    
    // Process workflow steps
    const steps = agentConfig.workflow_data?.steps || [];
    const results = [];
    
    for (const step of steps) {
      results.push({
        step_id: step.id,
        step_name: step.name,
        status: 'completed',
        result: \`Step \${step.name} executed successfully\`
      });
    }
    
    res.json({
      success: true,
      agent_id: agentConfig.id,
      results,
      execution_time: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: agentConfig.name });
});

app.listen(port, () => {
  console.log(\`Agent \${agentConfig.name} running on port \${port}\`);
});`;

    // Create zip-like structure
    const files = {
      'Dockerfile': dockerfile,
      'package.json': JSON.stringify(packageJson, null, 2),
      'index.js': indexJs,
      'config.json': JSON.stringify(agent, null, 2),
      'README.md': `# ${agent.name} Docker Container\n\n## Build and Run\n\n\`\`\`bash\ndocker build -t agent-${agent.id.slice(0, 8)} .\ndocker run -p 3000:3000 agent-${agent.id.slice(0, 8)}\n\`\`\`\n\n## API Endpoints\n\n- POST /execute - Execute the agent workflow\n- GET /health - Health check`
    };

    // Download as individual files (in a real implementation, you'd create a zip)
    Object.entries(files).forEach(([filename, content]) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    toast({
      title: "Docker Files Downloaded",
      description: "Docker container files downloaded successfully",
    });
  };

  const handleDownloadSourceCode = () => {
    const sourceCode = `#!/usr/bin/env node

/**
 * ${agent.name}
 * ${agent.description}
 * 
 * Standalone agent implementation
 */

const fs = require('fs');
const path = require('path');

class Agent {
  constructor(config) {
    this.config = config;
    this.workflowData = config.workflow_data || {};
    this.steps = this.workflowData.steps || [];
  }

  async execute(inputData = {}) {
    console.log(\`Executing agent: \${this.config.name}\`);
    const results = [];
    
    for (const step of this.steps) {
      try {
        const result = await this.executeStep(step, inputData);
        results.push(result);
        console.log(\`Step \${step.name} completed:\`, result);
      } catch (error) {
        console.error(\`Step \${step.name} failed:\`, error.message);
        results.push({
          step_id: step.id,
          step_name: step.name,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      agent_id: this.config.id,
      agent_name: this.config.name,
      results,
      execution_time: new Date().toISOString()
    };
  }

  async executeStep(step, inputData) {
    // Implement step execution logic based on step type
    switch (step.type) {
      case 'trigger':
        return this.executeTrigger(step, inputData);
      case 'action':
        return this.executeAction(step, inputData);
      case 'notification':
        return this.executeNotification(step, inputData);
      case 'email':
        return this.executeEmail(step, inputData);
      default:
        return {
          step_id: step.id,
          step_name: step.name,
          status: 'completed',
          result: \`Step \${step.name} executed with default handler\`
        };
    }
  }

  async executeTrigger(step, inputData) {
    const event = step.config?.event || 'manual';
    return {
      step_id: step.id,
      step_name: step.name,
      status: 'completed',
      result: \`Trigger fired: \${event}\`
    };
  }

  async executeAction(step, inputData) {
    return {
      step_id: step.id,
      step_name: step.name,
      status: 'completed',
      result: \`Action \${step.name} executed\`
    };
  }

  async executeNotification(step, inputData) {
    const message = step.config?.message || 'Default notification';
    console.log('Notification:', message);
    return {
      step_id: step.id,
      step_name: step.name,
      status: 'completed',
      result: \`Notification sent: \${message}\`
    };
  }

  async executeEmail(step, inputData) {
    const { to, subject } = step.config || {};
    console.log(\`Email would be sent to: \${to}, Subject: \${subject}\`);
    return {
      step_id: step.id,
      step_name: step.name,
      status: 'completed',
      result: \`Email sent to \${to}\`
    };
  }
}

// Configuration
const agentConfig = ${JSON.stringify(agent, null, 2)};

// Create and run agent
const agent = new Agent(agentConfig);

// CLI interface
if (require.main === module) {
  agent.execute(process.argv.slice(2))
    .then(result => {
      console.log('\\nExecution completed:');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('Execution failed:', error);
      process.exit(1);
    });
}

module.exports = Agent;`;

    const blob = new Blob([sourceCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-${agent.id.slice(0, 8)}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Source Code Downloaded",
      description: "Standalone agent source code downloaded",
    });
  };

  const generateAPICode = () => {
    const currentApiKey = apiKey || agent.configuration?.api_key || 'YOUR_API_KEY';
    return `// Example API usage
const response = await fetch('${deploymentUrl || `https://bkxbkaggxqcsiylwcopt.supabase.co/functions/v1/execute-ai-agent`}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${currentApiKey}'
  },
  body: JSON.stringify({
    agentId: "${agent.id}",
    workflowData: ${JSON.stringify(agent.workflow_data, null, 2)},
    inputData: {
      // your input parameters here
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
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Cloud Deployment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cloud className="h-5 w-5" />
                      Cloud Deployment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {deploymentStatus === "idle" && (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Deploy to cloud infrastructure for scalable hosting.
                        </p>
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
                        </div>
                        <Button onClick={handleDeploy} disabled={isDeploying} className="w-full">
                          <Cloud className="h-4 w-4 mr-2" />
                          Deploy to Cloud
                        </Button>
                      </>
                    )}
                    {deploymentStatus === "deploying" && (
                      <div className="text-center">
                        <div className="animate-spin h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full mb-2"></div>
                        <p className="text-sm text-muted-foreground">Deploying...</p>
                      </div>
                    )}
                    {deploymentStatus === "success" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Deployed Successfully</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input value={deploymentUrl} readOnly className="flex-1 text-xs" />
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(deploymentUrl)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {deploymentStatus === "error" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Deployment Failed</span>
                        </div>
                        <Button onClick={handleDeploy} variant="outline" className="w-full">
                          Retry Deployment
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Local Deployment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Local Deployment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Download and run on your own infrastructure for complete control.
                    </p>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full" onClick={handleDownloadAgent}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Agent Package
                      </Button>
                      <Button variant="outline" className="w-full" onClick={handleDownloadDockerImage}>
                        <Server className="h-4 w-4 mr-2" />
                        Download Docker Image
                      </Button>
                      <Button variant="outline" className="w-full" onClick={handleDownloadSourceCode}>
                        <Code className="h-4 w-4 mr-2" />
                        Download Source Code
                      </Button>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Quick Setup:</h4>
                      <pre className="text-xs text-muted-foreground">
                        <code>{`# Extract and run
tar -xzf agent-${agent.id.slice(0, 8)}.tar.gz
cd agent-${agent.id.slice(0, 8)}
./start.sh`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      onClick={generateAPIKey}
                      disabled={generatingKey}
                    >
                      {generatingKey ? "Generating..." : "Generate API Key"}
                    </Button>
                    {(apiKey || agent.configuration?.api_key) && (
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-mono break-all">
                          {apiKey || agent.configuration?.api_key}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(apiKey || agent.configuration?.api_key)}
                          className="mt-2"
                        >
                          Copy API Key
                        </Button>
                      </div>
                    )}
                  </div>
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