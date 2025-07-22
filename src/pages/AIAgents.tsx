import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Plus, Settings, Play } from "lucide-react"

export default function AIAgents() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">Intelligent agents for automated workflows</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Agent Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse and deploy pre-built AI agents for various tasks
            </p>
            <Button variant="outline" className="w-full">Explore Agents</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Build New Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use our wizard to create custom AI agents
            </p>
            <Button variant="outline" className="w-full">Start Building</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Assign to Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connect agents to existing business workflows
            </p>
            <Button variant="outline" className="w-full">Manage Workflows</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}