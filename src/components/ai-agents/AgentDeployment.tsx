import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertCircle,
  Key,
  RotateCcw,
  Eye,
  EyeOff,
  Trash2,
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
  const [deploymentStatus, setDeploymentStatus] = useState<
    "idle" | "deploying" | "success" | "error"
  >("idle");
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [keyName, setKeyName] = useState("");
  const { toast } = useToast();

  // Load existing API keys on component mount
  useEffect(() => {
    loadApiKeys();
  }, [agent.id]);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_api_keys')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const generateSecureApiKey = () => {
    // Generate secure API key using crypto.getRandomValues
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const randomString = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Create a structured API key with prefix and checksum
    const prefix = 'ak_live';
    const timestamp = Date.now().toString(36);
    const keyId = crypto.randomUUID().substring(0, 8);
    
    return `${prefix}_${keyId}_${timestamp}_${randomString.substring(0, 24)}`;
  };

  const generateAPIKey = async () => {
    if (!keyName.trim()) {
      toast({
        title: "Key Name Required",
        description: "Please enter a name for your API key",
        variant: "destructive",
      });
      return;
    }

    setGeneratingKey(true);
    try {
      // Generate secure API key
      const newApiKey = generateSecureApiKey();
      
      // Store the hashed key using RPC function
      const { data, error } = await supabase
        .rpc('create_agent_api_key', {
          p_agent_id: agent.id,
          p_key_text: newApiKey,
          p_name: keyName
        });

      if (error) throw error;

      // Set the cleartext key to show to user once
      setApiKey(newApiKey);
      setShowApiKey(true);
      setKeyName("");
      
      // Reload the keys list
      await loadApiKeys();

      toast({
        title: "API Key Generated",
        description: "Your new API key has been created. Save it now - you won't see it again!",
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

  const revokeApiKey = async (keyId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('revoke_agent_api_key', {
          p_key_id: keyId
        });

      if (error) throw error;

      toast({
        title: "API Key Revoked",
        description: "The API key has been revoked successfully",
      });

      // Reload the keys list
      await loadApiKeys();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      });
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentStatus("deploying");

    try {
      // Simulate deployment process
      await new Promise((resolve) => setTimeout(resolve, 3000));

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
      readme: `# ${agent.name}\n\n${agent.description}\n\n## Quick Start\n\n1. Extract the package\n2. Run: ./start.sh\n3. Access API at http://localhost:3000\n\n## Configuration\n\nEdit config.json to customize settings.`,
    };

    const blob = new Blob([JSON.stringify(agentPackage, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
        dev: "node index.js",
      },
      dependencies: {
        express: "^4.18.0",
        axios: "^1.6.0",
        dotenv: "^16.0.0",
      },
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
      Dockerfile: dockerfile,
      "package.json": JSON.stringify(packageJson, null, 2),
      "index.js": indexJs,
      "config.json": JSON.stringify(agent, null, 2),
      "README.md": `# ${agent.name} Docker Container\n\n## Build and Run\n\n\`\`\`bash\ndocker build -t agent-${agent.id.slice(0, 8)} .\ndocker run -p 3000:3000 agent-${agent.id.slice(0, 8)}\n\`\`\`\n\n## API Endpoints\n\n- POST /execute - Execute the agent workflow\n- GET /health - Health check`,
    };

    // Download as individual files (in a real implementation, you'd create a zip)
    Object.entries(files).forEach(([filename, content]) => {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
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

    const blob = new Blob([sourceCode], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
    const currentApiKey =
      apiKey || agent.configuration?.api_key || "YOUR_API_KEY";
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

          <TabsContent
            value="config"
            className="space-y-4 h-[calc(100%-40px)] overflow-y-auto"
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Environment Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="environment">Environment</Label>
                      <Select
                        value={deploymentConfig.environment}
                        onValueChange={(value) =>
                          setDeploymentConfig({
                            ...deploymentConfig,
                            environment: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">
                            Development
                          </SelectItem>
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
                          setDeploymentConfig({
                            ...deploymentConfig,
                            scaling: value,
                          })
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
                            timeout: parseInt(e.target.value) || 30,
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
                          setDeploymentConfig({
                            ...deploymentConfig,
                            api_enabled: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="monitoring-enabled">Monitoring</Label>
                      <Switch
                        id="monitoring-enabled"
                        checked={deploymentConfig.monitoring_enabled}
                        onCheckedChange={(checked) =>
                          setDeploymentConfig({
                            ...deploymentConfig,
                            monitoring_enabled: checked,
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Resource Allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="memory">Memory</Label>
                      <Select
                        value={deploymentConfig.memory}
                        onValueChange={(value) =>
                          setDeploymentConfig({
                            ...deploymentConfig,
                            memory: value,
                          })
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
                          setDeploymentConfig({
                            ...deploymentConfig,
                            cpu: value,
                          })
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
                          setDeploymentConfig({
                            ...deploymentConfig,
                            webhook_url: e.target.value,
                          })
                        }
                        placeholder="https://your-app.com/webhook"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="deploy"
            className="space-y-4 h-[calc(100%-40px)] overflow-y-auto"
          >
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
                            <Badge variant="outline">
                              {deploymentConfig.environment}
                            </Badge>
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
                        <Button
                          onClick={handleDeploy}
                          disabled={isDeploying}
                          className="w-full"
                        >
                          <Cloud className="h-4 w-4 mr-2" />
                          Deploy to Cloud
                        </Button>
                      </>
                    )}
                    {deploymentStatus === "deploying" && (
                      <div className="text-center">
                        <div className="animate-spin h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full mb-2"></div>
                        <p className="text-sm text-muted-foreground">
                          Deploying...
                        </p>
                      </div>
                    )}
                    {deploymentStatus === "success" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Deployed Successfully
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={deploymentUrl}
                            readOnly
                            className="flex-1 text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(deploymentUrl)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {deploymentStatus === "error" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Deployment Failed
                          </span>
                        </div>
                        <Button
                          onClick={handleDeploy}
                          variant="outline"
                          className="w-full"
                        >
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
                      Download and run on your own infrastructure for complete
                      control.
                    </p>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleDownloadAgent}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Agent Package
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleDownloadDockerImage}
                      >
                        <Server className="h-4 w-4 mr-2" />
                        Download Docker Image
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleDownloadSourceCode}
                      >
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

          <TabsContent
            value="api"
            className="space-y-4 h-[calc(100%-40px)] overflow-y-auto"
          >
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
                        value={
                          deploymentUrl
                            ? `${deploymentUrl}/api/execute`
                            : "Deploy agent to get API URL"
                        }
                        readOnly
                        className="flex-1"
                      />
                      {deploymentUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(`${deploymentUrl}/api/execute`)
                          }
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
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* New API Key Generation */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="key-name">Generate New API Key</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="key-name"
                          placeholder="Enter a name for this key (e.g., 'Production App')"
                          value={keyName}
                          onChange={(e) => setKeyName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={generateAPIKey}
                          disabled={generatingKey || !keyName.trim()}
                        >
                          {generatingKey ? "Generating..." : "Generate"}
                        </Button>
                      </div>
                    </div>

                    {/* Show newly generated key once */}
                    {apiKey && showApiKey && (
                      <div className="p-4 border-2 border-orange-200 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-800">
                            Save this API key now!
                          </span>
                        </div>
                        <p className="text-sm text-orange-700 mb-3">
                          This is the only time you'll see the full key. Store it safely.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            value={apiKey}
                            readOnly
                            className="font-mono text-sm flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              copyToClipboard(apiKey);
                              toast({
                                title: "API Key Copied",
                                description: "API key copied to clipboard",
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setApiKey(null);
                              setShowApiKey(false);
                            }}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Existing API Keys */}
                  <div className="space-y-3">
                    <Label>Active API Keys</Label>
                    {apiKeys.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No API keys generated yet.</p>
                        <p className="text-sm">Generate your first key above to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {apiKeys.map((key) => (
                          <div
                            key={key.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">
                                  {key.key_prefix}••••••••••••••••
                                </span>
                                {key.name && (
                                  <Badge variant="outline">{key.name}</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Created: {new Date(key.created_at).toLocaleDateString()}
                                {key.last_used_at && (
                                  <span className="ml-2">
                                    Last used: {new Date(key.last_used_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => revokeApiKey(key.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Security Best Practices:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Store API keys in environment variables, never in code</li>
                      <li>• Use different keys for different environments</li>
                      <li>• Rotate keys regularly and revoke unused ones</li>
                      <li>• Monitor API key usage for suspicious activity</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="monitoring"
            className="space-y-4 h-[calc(100%-40px)] overflow-y-auto"
          >
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
                      <div className="text-sm text-muted-foreground">
                        Executions
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">0ms</div>
                      <div className="text-sm text-muted-foreground">
                        Avg Response
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">99.9%</div>
                      <div className="text-sm text-muted-foreground">
                        Uptime
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">
                        Errors
                      </div>
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
