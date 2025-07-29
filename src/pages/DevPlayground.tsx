import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Code, GitFork, Rocket, TestTube } from "lucide-react"

export default function DevPlayground() {
  const navigate = useNavigate()
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Dev Playground</h1>
          <p className="text-muted-foreground">Development environment for trusted builders</p>
        </div>
        <Button onClick={() => navigate('/app/dev-playground/new')}>
          <Code className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Safe testing environment for smart contracts
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/app/dev-playground/test')}
            >
              Start Testing
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitFork className="h-5 w-5" />
              Fork & Customize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Fork existing contracts and customize for your needs
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/app/dev-playground/forks')}
            >
              Browse Forks
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Deploy to Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Deploy tested contracts to production network
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/app/dev-playground/deploy')}
            >
              Deploy
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}