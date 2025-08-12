import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Wifi, Activity, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface NetworkNode {
  id: number;
  name: string;
  url: string;
  latency: number | null;
  status: "online" | "offline";
}

export default function NodeManagement(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<NetworkNode[]>([
    {
      id: 1,
      name: "Validator 1",
      url: "https://example-node1.com/health",
      latency: null,
      status: "offline",
    },
    {
      id: 2,
      name: "Validator 2",
      url: "https://example-node2.com/health",
      latency: null,
      status: "offline",
    },
  ]);

  const nodesRef = useRef(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const checkNodes = async () => {
    const updated = await Promise.all(
      nodesRef.current.map(async (node) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const start = performance.now();
        try {
          const response = await fetch(node.url, { signal: controller.signal });
          clearTimeout(timeout);
          const latency = Math.round(performance.now() - start);
          if (response.ok) {
            return { ...node, status: "online" as const, latency };
          }
          return { ...node, status: "offline" as const, latency: null };
        } catch (error) {
          clearTimeout(timeout);
          return { ...node, status: "offline" as const, latency: null };
        }
      }),
    );
    setNodes(updated);
  };

  useEffect(() => {
    checkNodes();
    const interval = setInterval(checkNodes, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddNode = () => {
    toast({
      title: "Add Node",
      description: "Adding new network node",
    });
  };

  const handleViewPeers = () => {
    navigate("/app/diagnostics");
  };

  const handleViewLogs = () => {
    navigate("/app/audit");
  };

  const handleConfigureTrust = () => {
    navigate("/app/divine-trust");
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Node Management</h1>
          <p className="text-muted-foreground">
            Manage network nodes and peer connections
          </p>
        </div>
        <Button onClick={handleAddNode}>
          <Globe className="h-4 w-4 mr-2" />
          Add Node
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Network Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{node.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {node.url}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      node.status === "online" ? "default" : "destructive"
                    }
                  >
                    {node.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {node.latency !== null ? `${node.latency} ms` : "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Peer Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor active peer connections and network health
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewPeers}
            >
              View Peers
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Latency Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track network performance and latency metrics
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewLogs}
            >
              View Logs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Relay Trust Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage trust levels for network relays
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleConfigureTrust}
            >
              Configure Trust
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
