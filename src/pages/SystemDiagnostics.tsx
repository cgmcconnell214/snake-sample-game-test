import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Monitor, AlertTriangle, Brain, Gauge } from "lucide-react"

export default function SystemDiagnostics() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">System Diagnostics</h1>
          <p className="text-muted-foreground">Monitor system health and performance</p>
        </div>
        <Button>
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
            <Button variant="outline" className="w-full">View Events</Button>
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
            <Button variant="outline" className="w-full">Track Memory</Button>
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
            <Button variant="outline" className="w-full">Monitor Drift</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}