import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, PieChart, Activity, RefreshCw, DollarSign, Coins, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTokenomicsData } from "@/hooks/useTokenomicsData";
import { TokenomicsCharts } from "@/components/TokenomicsCharts";

export default function TokenomicsPage(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { metrics, velocityData, supplyAnalytics, loading, error, refetch } = useTokenomicsData();

  const handleGenerateReport = () => {
    navigate("/app/reports");
  };

  const handleRefresh = async () => {
    toast({
      title: "Refreshing Data",
      description: "Updating tokenomics metrics...",
    });
    await refetch();
    toast({
      title: "Data Updated",
      description: "Tokenomics metrics have been refreshed",
    });
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-destructive">Failed to Load Data</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={refetch}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tokenomics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time metrics and economic analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleGenerateReport}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                ${metrics?.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics?.totalSupply.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Velocity</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics?.velocity.toFixed(3)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  ${metrics?.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <Badge variant={metrics && metrics.priceChange24h >= 0 ? "default" : "destructive"}>
                  {metrics && metrics.priceChange24h >= 0 ? "+" : ""}{metrics?.priceChange24h.toFixed(2)}%
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <TokenomicsCharts 
        velocityData={velocityData} 
        supplyAnalytics={supplyAnalytics} 
        loading={loading} 
      />

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Velocity Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Deep dive into token circulation patterns and velocity trends
            </p>
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="font-medium">Active Tokens:</span> {loading ? <Skeleton className="inline-block h-4 w-8" /> : metrics?.activeTokens}
              </div>
              <div className="text-sm">
                <span className="font-medium">Total Transactions:</span> {loading ? <Skeleton className="inline-block h-4 w-8" /> : metrics?.totalTransactions}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/app/trading")}
            >
              View Trading Data
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
              Monitor token supply distribution across stakeholder groups
            </p>
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="font-medium">Circulating:</span> {loading ? <Skeleton className="inline-block h-4 w-8" /> : metrics?.circulatingSupply.toLocaleString()}
              </div>
              <div className="text-sm">
                <span className="font-medium">Locked:</span> {loading ? <Skeleton className="inline-block h-4 w-8" /> : (metrics ? (metrics.totalSupply - metrics.circulatingSupply).toLocaleString() : '0')}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/app/token-supply")}
            >
              Analyze Supply
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Contract Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize smart contract interactions and token flows
            </p>
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="font-medium">Market Cap:</span> {loading ? <Skeleton className="inline-block h-4 w-8" /> : `$${metrics?.marketCap.toLocaleString()}`}
              </div>
              <div className="text-sm">
                <span className="font-medium">Price Change:</span> {loading ? <Skeleton className="inline-block h-4 w-8" /> : `${metrics?.priceChange24h.toFixed(2)}%`}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/app/smart-contracts")}
            >
              View Contracts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
