import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Brain,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StrategyRunner, StrategyFactory, type StrategySignal, type MarketData } from "@/lib/strategy-runner";

export function AITradingBot(): JSX.Element {
  const [isActive, setIsActive] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<StrategyRunner | null>(null);
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const [performance, setPerformance] = useState({
    totalTrades: 0,
    successRate: 0,
    totalPnL: 0,
    confidenceScore: 75
  });
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with conservative gold strategy
    const config = StrategyFactory.createGoldConservativeStrategy();
    const strategy = new StrategyRunner(config);
    setCurrentStrategy(strategy);
  }, []);

  const handleToggleBot = () => {
    if (!currentStrategy) return;

    if (isActive) {
      currentStrategy.stop();
      setIsActive(false);
      toast({
        title: "AI Bot Stopped",
        description: "Trading bot has been deactivated",
      });
    } else {
      currentStrategy.start();
      setIsActive(true);
      simulateTrading();
      toast({
        title: "AI Bot Started",
        description: "Trading bot is now analyzing markets",
      });
    }
  };

  const simulateTrading = async () => {
    if (!currentStrategy) return;

    // Simulate market data
    const mockMarketData: MarketData[] = [
      {
        asset_symbol: 'GOLD001',
        current_price: 131.2 + (Math.random() - 0.5) * 10,
        volume_24h: 1250000,
        price_change_24h: (Math.random() - 0.5) * 10,
        volatility: Math.random() * 0.4,
        market_cap: 164000000,
        compliance_status: 'approved'
      },
      {
        asset_symbol: 'SILVER01',
        current_price: 10.15 + (Math.random() - 0.5) * 2,
        volume_24h: 890000,
        price_change_24h: (Math.random() - 0.5) * 8,
        volatility: Math.random() * 0.3,
        market_cap: 8630000,
        compliance_status: 'approved'
      }
    ];

    try {
      const newSignals = await currentStrategy.executeStrategy(mockMarketData);
      setSignals(prev => [...newSignals, ...prev].slice(0, 10));

      // Update performance metrics
      setPerformance(prev => ({
        totalTrades: prev.totalTrades + newSignals.length,
        successRate: Math.min(85, prev.successRate + Math.random() * 2),
        totalPnL: prev.totalPnL + (Math.random() - 0.3) * 1000,
        confidenceScore: Math.max(60, Math.min(95, prev.confidenceScore + (Math.random() - 0.5) * 5))
      }));

    } catch (error) {
      console.error('Trading simulation error:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && currentStrategy) {
      interval = setInterval(simulateTrading, 10000); // Every 10 seconds
    }
    return () => clearInterval(interval);
  }, [isActive, currentStrategy]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bot Control Panel */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Trading Bot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="bot-toggle">Bot Status</Label>
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
              <Switch
                id="bot-toggle"
                checked={isActive}
                onCheckedChange={handleToggleBot}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Strategy:</span>
              <span className="text-sm font-medium">Gold Conservative</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Confidence:</span>
              <span className="text-sm font-medium">{performance.confidenceScore}%</span>
            </div>
            <Progress value={performance.confidenceScore} className="h-2" />
          </div>

          <Button 
            className="w-full" 
            onClick={handleToggleBot}
            variant={isActive ? "destructive" : "default"}
          >
            {isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Bot
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Bot
              </>
            )}
          </Button>

          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-warning mb-1">
                  Risk Notice
                </div>
                <div className="text-muted-foreground">
                  AI trading involves risk. Past performance does not guarantee future results.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{performance.totalTrades}</div>
              <div className="text-xs text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-buy">
                {performance.successRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${performance.totalPnL >= 0 ? 'text-buy' : 'text-sell'}`}>
              {performance.totalPnL >= 0 ? '+' : ''}${performance.totalPnL.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">Total P&L</div>
          </div>

          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm">AI Confidence: {performance.confidenceScore}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Signals */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recent Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {signals.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No signals yet</p>
                <p className="text-xs">Start the bot to see AI recommendations</p>
              </div>
            ) : (
              signals.map((signal, index) => (
                <div key={index} className="p-3 rounded border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant={
                        signal.action === 'buy' ? 'default' : 
                        signal.action === 'sell' ? 'destructive' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {signal.action.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {signal.action === 'buy' ? (
                        <TrendingUp className="h-3 w-3 text-buy" />
                      ) : signal.action === 'sell' ? (
                        <TrendingDown className="h-3 w-3 text-sell" />
                      ) : (
                        <CheckCircle className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-xs font-mono">
                        {(signal.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {signal.reasoning}
                  </div>
                  {signal.price_target && (
                    <div className="text-xs font-mono mt-1">
                      Target: ${signal.price_target.toFixed(2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Strategy Details */}
      <Card className="lg:col-span-3 bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Strategy Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current" className="w-full">
            <TabsList>
              <TabsTrigger value="current">Current Strategy</TabsTrigger>
              <TabsTrigger value="risk">Risk Management</TabsTrigger>
              <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Strategy Type</Label>
                  <p className="text-sm text-muted-foreground">Conservative Gold Trading</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Risk Tolerance</Label>
                  <p className="text-sm text-muted-foreground">30% (Conservative)</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Position Size</Label>
                  <p className="text-sm text-muted-foreground">$10,000</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Stop Loss</Label>
                  <p className="text-sm text-muted-foreground">5%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Take Profit</Label>
                  <p className="text-sm text-muted-foreground">10%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Compliance Threshold</Label>
                  <p className="text-sm text-muted-foreground">70%</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Technical Indicators</Label>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    <li>Price trend analysis</li>
                    <li>Volatility monitoring</li>
                    <li>Volume analysis</li>
                  </ul>
                </div>
                <div>
                  <Label className="text-sm font-medium">Risk Factors</Label>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    <li>Market volatility assessment</li>
                    <li>Compliance status verification</li>
                    <li>Liquidity evaluation</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}