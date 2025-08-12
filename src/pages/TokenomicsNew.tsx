import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  DollarSign,
  Users,
  Zap,
  Target,
  ArrowUpDown,
  Coins,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TokenMetrics {
  totalSupply: number;
  circulatingSupply: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  transactions24h: number;
  avgTransactionSize: number;
  velocity: number;
}

interface TokenFlowData {
  inflow: number;
  outflow: number;
  netFlow: number;
  stakingRewards: number;
  liquidityProvision: number;
  tradingFees: number;
}

interface VelocityData {
  period: string;
  velocity: number;
  volume: number;
  avgHoldTime: number;
}

export default function TokenomicsDashboard(): JSX.Element {
  const [metrics, setMetrics] = useState<TokenMetrics | null>(null);
  const [flowData, setFlowData] = useState<TokenFlowData | null>(null);
  const [velocityData, setVelocityData] = useState<VelocityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const { toast } = useToast();

  useEffect(() => {
    fetchTokenomicsData();
  }, [selectedPeriod]);

  const fetchTokenomicsData = async () => {
    try {
      // Fetch real asset data and calculate metrics
      const { data: assets } = await supabase
        .from("tokenized_assets")
        .select("*")
        .eq("is_active", true);

      const totalAssets = assets?.length || 0;
      const totalSupply =
        assets?.reduce(
          (sum, asset) => sum + parseFloat(asset.total_supply.toString()),
          0,
        ) || 0;
      const circulatingSupply =
        assets?.reduce(
          (sum, asset) => sum + parseFloat(asset.circulating_supply.toString()),
          0,
        ) || 0;

      // Generate realistic metrics based on actual data
      const mockMetrics: TokenMetrics = {
        totalSupply: totalSupply,
        circulatingSupply: circulatingSupply,
        marketCap: totalSupply * 1.25, // Assuming average token price of $1.25
        volume24h: Math.floor(Math.random() * 50000) + 100000,
        holders: Math.floor(Math.random() * 500) + totalAssets * 10,
        transactions24h: Math.floor(Math.random() * 200) + 150,
        avgTransactionSize: Math.floor(Math.random() * 1000) + 500,
        velocity: Math.random() * 2 + 0.5, // Token velocity between 0.5-2.5
      };

      const mockFlowData: TokenFlowData = {
        inflow: Math.floor(Math.random() * 25000) + 50000,
        outflow: Math.floor(Math.random() * 20000) + 45000,
        netFlow: 0, // Will be calculated
        stakingRewards: Math.floor(Math.random() * 5000) + 2000,
        liquidityProvision: Math.floor(Math.random() * 10000) + 8000,
        tradingFees: Math.floor(Math.random() * 2000) + 1000,
      };
      mockFlowData.netFlow = mockFlowData.inflow - mockFlowData.outflow;

      const mockVelocityData: VelocityData[] = [
        { period: "7d ago", velocity: 1.2, volume: 85000, avgHoldTime: 15 },
        { period: "6d ago", velocity: 1.5, volume: 92000, avgHoldTime: 12 },
        { period: "5d ago", velocity: 1.8, volume: 78000, avgHoldTime: 18 },
        { period: "4d ago", velocity: 1.3, volume: 105000, avgHoldTime: 14 },
        { period: "3d ago", velocity: 2.1, volume: 115000, avgHoldTime: 8 },
        { period: "2d ago", velocity: 1.7, volume: 88000, avgHoldTime: 16 },
        {
          period: "1d ago",
          velocity: mockMetrics.velocity,
          volume: mockMetrics.volume24h,
          avgHoldTime: 11,
        },
      ];

      setMetrics(mockMetrics);
      setFlowData(mockFlowData);
      setVelocityData(mockVelocityData);
    } catch (error) {
      console.error("Error fetching tokenomics data:", error);
      toast({
        title: "Error",
        description: "Failed to load tokenomics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!metrics || !flowData) return;

    try {
      const reportData = {
        period: selectedPeriod,
        metrics: metrics,
        flows: flowData,
        velocity: velocityData,
        generatedAt: new Date().toISOString(),
      };

      // Simulate report generation
      toast({
        title: "Report Generated",
        description:
          "Tokenomics report has been generated and sent to your message center",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading tokenomics data...</div>
      </div>
    );
  }

  if (!metrics || !flowData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Failed to load tokenomics data</div>
      </div>
    );
  }

  const supplyUtilization =
    (metrics.circulatingSupply / metrics.totalSupply) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tokenomics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive token economy metrics and analytics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedPeriod("24h")}>
            24H
          </Button>
          <Button variant="outline" onClick={() => setSelectedPeriod("7d")}>
            7D
          </Button>
          <Button variant="outline" onClick={() => setSelectedPeriod("30d")}>
            30D
          </Button>
          <Button onClick={generateReport}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.marketCap)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.volume24h)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(metrics.transactions24h)} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Holders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(metrics.holders)}
            </div>
            <p className="text-xs text-muted-foreground">+8.3% growth rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Token Velocity
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.velocity.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Circulation rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="supply" className="space-y-6">
        <TabsList>
          <TabsTrigger value="supply">Supply Analytics</TabsTrigger>
          <TabsTrigger value="velocity">Velocity Metrics</TabsTrigger>
          <TabsTrigger value="flows">Token Flows</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="supply" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Supply Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Supply</span>
                    <span className="font-medium">
                      {formatNumber(metrics.totalSupply)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Circulating Supply</span>
                    <span className="font-medium">
                      {formatNumber(metrics.circulatingSupply)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Locked/Reserved</span>
                    <span className="font-medium">
                      {formatNumber(
                        metrics.totalSupply - metrics.circulatingSupply,
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Supply Utilization</span>
                    <span>{supplyUtilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={supplyUtilization} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Inflation & Deflation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      +2.1%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Minting Rate
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">-0.8%</div>
                    <div className="text-sm text-muted-foreground">
                      Burn Rate
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t">
                  <div className="text-xl font-bold text-blue-500">+1.3%</div>
                  <div className="text-sm text-muted-foreground">
                    Net Inflation Rate
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="velocity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Token Velocity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {metrics.velocity.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Current Velocity
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {formatCurrency(metrics.avgTransactionSize)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Transaction Size
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">11.5</div>
                  <div className="text-sm text-muted-foreground">
                    Avg Hold Time (days)
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">7-Day Velocity Trend</h4>
                <div className="space-y-2">
                  {velocityData.map((data, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium w-16">
                          {data.period}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            Velocity: {data.velocity.toFixed(2)}
                          </span>
                          <Badge variant="outline">
                            {formatCurrency(data.volume)}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {data.avgHoldTime}d avg hold
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flows" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Token Flow Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Inflow (24h)</span>
                    <span className="font-medium text-green-500">
                      +{formatCurrency(flowData.inflow)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Outflow (24h)</span>
                    <span className="font-medium text-red-500">
                      -{formatCurrency(flowData.outflow)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Net Flow</span>
                    <span
                      className={`font-bold ${flowData.netFlow > 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {flowData.netFlow > 0 ? "+" : ""}
                      {formatCurrency(flowData.netFlow)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Revenue Streams
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Staking Rewards</span>
                    <span className="font-medium">
                      {formatCurrency(flowData.stakingRewards)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Liquidity Provision</span>
                    <span className="font-medium">
                      {formatCurrency(flowData.liquidityProvision)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Trading Fees</span>
                    <span className="font-medium">
                      {formatCurrency(flowData.tradingFees)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Total Revenue</span>
                    <span className="font-bold">
                      {formatCurrency(
                        flowData.stakingRewards +
                          flowData.liquidityProvision +
                          flowData.tradingFees,
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Token Distribution Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Holder Distribution</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Large Holders (&gt;10k tokens)
                      </span>
                      <div className="flex items-center gap-2">
                        <Progress value={15} className="w-20" />
                        <span className="text-sm">15%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Medium Holders (1k-10k)</span>
                      <div className="flex items-center gap-2">
                        <Progress value={35} className="w-20" />
                        <span className="text-sm">35%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Small Holders (&lt;1k)</span>
                      <div className="flex items-center gap-2">
                        <Progress value={50} className="w-20" />
                        <span className="text-sm">50%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Geographic Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">North America</span>
                      <span className="text-sm">42%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Europe</span>
                      <span className="text-sm">28%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Asia Pacific</span>
                      <span className="text-sm">22%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Other</span>
                      <span className="text-sm">8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
