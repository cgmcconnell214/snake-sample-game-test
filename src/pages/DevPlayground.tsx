import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, GitFork, Rocket, TestTube } from "lucide-react";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";

export default function DevPlayground(): JSX.Element {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const runUserCode = () => {
    if (!iframeRef.current) return;
    const sanitized = DOMPurify.sanitize(code, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
    const blob = new Blob(
      [`<!DOCTYPE html><html><body><script>${sanitized}\n<\/script></body></html>`],
      { type: "text/html" }
    );
    iframeRef.current.src = URL.createObjectURL(blob);
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run Code</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-40 p-2 border rounded mb-4 font-mono text-sm"
            placeholder="Enter JavaScript code"
          />
          <Button onClick={runUserCode} className="mb-4">
            Run Code
          </Button>
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts"
            title="code-output"
            className="w-full h-64 border"
          />
        </CardContent>
      </Card>
    </div>
  );
}
