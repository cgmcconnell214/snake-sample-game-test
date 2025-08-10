import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, PieChart, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function TokenomicsPage(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGenerateReport = () => {
    navigate('/app/reports');
  };

  const handleViewVelocity = () => {
    navigate('/app/trading');
  };

  const handleAnalyzeSupply = () => {
    navigate('/app/token-supply');
  };

  const handleViewFlows = () => {
    navigate('/app/smart-contracts');
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tokenomics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time metrics and economic analytics
          </p>
        </div>
        <Button onClick={handleGenerateReport}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Velocity Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track token velocity and circulation patterns
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewVelocity}>
              View Velocity
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Supply Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor token supply distribution and inflation
            </p>
            <Button variant="outline" className="w-full" onClick={handleAnalyzeSupply}>
              Analyze Supply
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Contract Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize smart contract interactions and flows
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewFlows}>
              View Flows
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
