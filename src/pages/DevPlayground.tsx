import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, GitFork, Rocket, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import ScrapeBot from "@/components/ScrapeBot";

export default function DevPlayground(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleNewProject = () => {
    navigate('/app/smart-contracts');
  };

  const handleStartTesting = () => {
    navigate('/app/smart-contracts');
  };

  const handleBrowseForks = () => {
    navigate('/app/smart-contracts');
  };

  const handleDeploy = () => {
    navigate('/app/smart-contracts');
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dev Playground</h1>
          <p className="text-muted-foreground">
            Development environment for trusted builders
          </p>
        </div>
        <Button onClick={handleNewProject}>
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
            <Button variant="outline" className="w-full" onClick={handleStartTesting}>
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
            <Button variant="outline" className="w-full" onClick={handleBrowseForks}>
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
            <Button variant="outline" className="w-full" onClick={handleDeploy}>
              Deploy
            </Button>
          </CardContent>
        </Card>

        {/* Scrape Bot */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Scrape Bot</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrapeBot />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
