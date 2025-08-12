import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Briefcase, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Portfolio = (): JSX.Element => {
  const { profile } = useAuth();
  const [portfolioData, setPortfolioData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!profile?.user_id) return;
      const { data, error } = await supabase
        .from("asset_holdings")
        .select(
          "balance, tokenized_assets(asset_symbol, asset_name, is_active, market_data(current_price, price_change_24h))",
        )
        .eq("user_id", profile.user_id);

      if (error) {
        console.error("Error fetching portfolio:", error);
        return;
      }

      const holdings = (data || []).map((holding: any) => {
        const asset = holding.tokenized_assets || {};
        const market = asset.market_data?.[0] || {};
        const balance = holding.balance || 0;
        const price = market.current_price || 0;
        return {
          symbol: asset.asset_symbol || "UNKNOWN",
          name: asset.asset_name || asset.asset_symbol || "Unknown Asset",
          balance,
          value: balance * price,
          change: market.price_change_24h || 0,
        };
      });

      setPortfolioData(holdings);
    };

    fetchPortfolio();
  }, [profile]);

  const totalValue = portfolioData.reduce((sum, asset) => sum + asset.value, 0);
  const totalGain = portfolioData.reduce(
    (sum, asset) => sum + (asset.value * asset.change) / 100,
    0,
  );
  const totalGainPercent = totalValue ? (totalGain / totalValue) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <Badge variant="outline" className="text-sm">
          <Briefcase className="w-4 h-4 mr-1" />
          {portfolioData.length} Assets
        </Badge>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Portfolio value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Change</CardTitle>
            {totalGainPercent >= 0 ? (
              <TrendingUp className="h-4 w-4 text-buy" />
            ) : (
              <TrendingDown className="h-4 w-4 text-sell" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalGainPercent >= 0 ? "text-buy" : "text-sell"}`}
            >
              {totalGainPercent >= 0 ? "+" : ""}
              {totalGainPercent.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${totalGain >= 0 ? "+" : ""}
              {totalGain.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assets</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioData.length}</div>
            <p className="text-xs text-muted-foreground">Different tokens</p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>
            Your tokenized assets and their current values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolioData.map((asset, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {asset.symbol.split("-")[1]?.slice(0, 2) || "TK"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {asset.symbol}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{asset.balance} tokens</p>
                  <p className="text-sm text-muted-foreground">
                    ${asset.value.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={asset.change >= 0 ? "default" : "destructive"}
                  >
                    {asset.change >= 0 ? "+" : ""}
                    {asset.change}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;
