import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradingChart } from "@/components/TradingChart";
import { OrderBook } from "@/components/OrderBook";
import { TradePanel } from "@/components/TradePanel";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Seo from "@/components/Seo";

interface PortfolioAsset {
  symbol: string;
  quantity: number;
  value: number;
  change: number;
  status: "verified" | "pending" | "unknown";
}

interface TradeRecord {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  time: string;
  status: string;
}

export default function Dashboard(): JSX.Element {
  const { profile } = useAuth();

  const [portfolioData, setPortfolioData] = useState<PortfolioAsset[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeRecord[]>([]);

  // Resolve user id from context or session
  const getUserId = async (): Promise<string | null> => {
    if (profile?.user_id) return profile.user_id as string;
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  };

  const fetchPortfolio = async () => {
    const userId = await getUserId();
    if (!userId) return;

    const { data, error } = await supabase
      .from("asset_holdings")
      .select(
        "balance, tokenized_assets(asset_symbol, asset_name, is_active, market_data(current_price, price_change_24h))",
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching portfolio:", error);
      return;
    }

    const holdings: PortfolioAsset[] = (data || []).map((h: any) => {
      const asset = h.tokenized_assets || {};
      const market = Array.isArray(asset.market_data)
        ? asset.market_data[0] || {}
        : {};
      const quantity = Number(h.balance || 0);
      const price = Number(market.current_price || 0);
      const change = Number(market.price_change_24h || 0);

      return {
        symbol: asset.asset_symbol || "UNKNOWN",
        quantity,
        value: quantity * price,
        change,
        status:
          asset.is_active === true
            ? "verified"
            : asset.is_active === false
              ? "pending"
              : "unknown",
      };
    });

    setPortfolioData(holdings);
  };

  const fetchTrades = async () => {
    const userId = await getUserId();
    if (!userId) return;

    const { data, error } = await supabase
      .from("trade_executions")
      .select(
        "id, buyer_id, seller_id, asset_symbol, quantity, price, execution_time, settlement_status",
      )
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("execution_time", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching trades:", error);
      return;
    }

    const trades: TradeRecord[] = (data || []).map((t: any) => ({
      id: t.id,
      symbol: t.asset_symbol,
      type: t.buyer_id === userId ? "BUY" : "SELL",
      quantity: Number(t.quantity),
      price: Number(t.price),
      time: t.execution_time
        ? new Date(t.execution_time).toLocaleTimeString()
        : "",
      status:
        t.settlement_status === "settled"
          ? "completed"
          : t.settlement_status || "pending",
    }));

    setRecentTrades(trades);
  };

  useEffect(() => {
    fetchPortfolio();
    fetchTrades();

    const holdingsChannel = supabase
      .channel("portfolio-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "asset_holdings" },
        fetchPortfolio,
      )
      .subscribe();

    const tradesChannel = supabase
      .channel("trade-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trade_executions" },
        fetchTrades,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(holdingsChannel);
      supabase.removeChannel(tradesChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalValue = useMemo(
    () => portfolioData.reduce((sum, asset) => sum + asset.value, 0),
    [portfolioData],
  );

  const totalGain = useMemo(
    () =>
      portfolioData.reduce(
        (sum, asset) => sum + (asset.value * asset.change) / 100,
        0,
      ),
    [portfolioData],
  );

  const totalGainPercent = useMemo(
    () => (totalValue ? (totalGain / totalValue) * 100 : 0),
    [totalGain, totalValue],
  );

  return (
    <div className="space-y-6 p-6">
      <Seo
        title="Dashboard | XRPL Asset Platform"
        description="Overview of your portfolio, recent trades, and trading activity."
        canonical={(typeof window !== "undefined" ? window.location.origin : "") + "/app"}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <p className="text-muted-foreground">
            XRPL Asset Tokenization & Trading Platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-success border-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            XRPL Connected
          </Badge>
          <Badge variant="outline" className="text-warning border-warning">
            <Shield className="h-3 w-3 mr-1" />
            KYC Verified
          </Badge>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Total Portfolio
              </span>
            </div>
            <div className="text-2xl font-bold font-mono">
              ${totalValue.toLocaleString()}
            </div>
            <div
              className={`flex items-center gap-1 text-sm ${
                totalGainPercent >= 0 ? "text-buy" : "text-sell"
              }`}
            >
              {totalGainPercent >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {totalGainPercent >= 0 ? "+" : ""}
              {totalGainPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">24h P&L</span>
            </div>
            <div className="text-2xl font-bold font-mono text-buy">
              +$1,247.85
            </div>
            <div className="flex items-center gap-1 text-sm text-buy">
              <TrendingUp className="h-3 w-3" />
              +2.34%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Active Orders
              </span>
            </div>
            <div className="text-2xl font-bold font-mono">7</div>
            <div className="text-sm text-muted-foreground">3 Buy, 4 Sell</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Compliance</span>
            </div>
            <div className="text-2xl font-bold font-mono text-warning">94%</div>
            <div className="text-sm text-muted-foreground">Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TradingChart symbol="GOLD-TOKEN" currentPrice={131.2} change={2.4} />

          {/* Portfolio Holdings */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle>Portfolio Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolioData.map((asset, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          asset.status === "verified" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {asset.status === "verified" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {asset.status}
                      </Badge>
                      <div>
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.quantity} tokens
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium">
                        ${asset.value.toLocaleString()}
                      </div>
                      <div
                        className={`text-sm ${
                          asset.change >= 0 ? "text-buy" : "text-sell"
                        }`}
                      >
                        {asset.change >= 0 ? "+" : ""}
                        {asset.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <TradePanel />
          <OrderBook />
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-4 text-xs text-muted-foreground font-medium border-b border-border pb-2">
              <div>Transaction ID</div>
              <div>Symbol</div>
              <div>Type</div>
              <div>Quantity</div>
              <div>Price</div>
              <div>Status</div>
            </div>
            {recentTrades.map((trade) => (
              <div
                key={trade.id}
                className="grid grid-cols-6 gap-4 text-sm font-mono py-2 hover:bg-muted/20 transition-colors rounded"
              >
                <div className="text-primary">{trade.id}</div>
                <div>{trade.symbol}</div>
                <div
                  className={trade.type === "BUY" ? "text-buy" : "text-sell"}
                >
                  {trade.type}
                </div>
                <div>{trade.quantity}</div>
                <div>${trade.price}</div>
                <div>
                  <Badge
                    variant={
                      trade.status === "completed" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {trade.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
