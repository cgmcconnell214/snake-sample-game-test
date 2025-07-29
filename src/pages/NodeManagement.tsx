import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GitBranch, Wifi, Activity, Globe } from "lucide-react"

export default function NodeManagement() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Node Management</h1>
          <p className="text-muted-foreground">Manage network nodes and peer connections</p>
        </div>
        <Button>
          <Globe className="h-4 w-4 mr-2" />
          Add Node
        </Button>
      </div>

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
            <Button variant="outline" className="w-full">View Peers</Button>
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
            <Button variant="outline" className="w-full">View Logs</Button>
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
            <Button variant="outline" className="w-full">Configure Trust</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}