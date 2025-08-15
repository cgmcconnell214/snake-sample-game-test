import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TokenMetrics {
  totalSupply: number;
  circulatingSupply: number;
  velocity: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  activeTokens: number;
  totalTransactions: number;
}

export interface VelocityData {
  timestamp: string;
  velocity: number;
  volume: number;
}

export interface SupplyAnalytics {
  tokenSymbol: string;
  totalSupply: number;
  circulatingSupply: number;
  lockedTokens: number;
  distributionBreakdown: {
    public: number;
    team: number;
    treasury: number;
    ecosystem: number;
  };
}

export function useTokenomicsData() {
  const [metrics, setMetrics] = useState<TokenMetrics | null>(null);
  const [velocityData, setVelocityData] = useState<VelocityData[]>([]);
  const [supplyAnalytics, setSupplyAnalytics] = useState<SupplyAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenomicsData = async () => {
    try {
      setLoading(true);
      
      // Fetch active tokenized assets
      const { data: assets, error: assetsError } = await supabase
        .from("tokenized_assets")
        .select("*")
        .eq("is_active", true);

      if (assetsError) throw assetsError;

      // Fetch market data for metrics calculation
      const { data: marketData, error: marketError } = await supabase
        .from("market_data")
        .select("*")
        .order("last_updated", { ascending: false });

      if (marketError) throw marketError;

      // Calculate overall metrics
      const totalMarketCap = marketData.reduce((sum, data) => sum + Number(data.market_cap), 0);
      const totalVolume = marketData.reduce((sum, data) => sum + Number(data.volume_24h), 0);
      const avgPriceChange = marketData.length > 0 
        ? marketData.reduce((sum, data) => sum + Number(data.price_change_24h), 0) / marketData.length 
        : 0;

      // Fetch recent trade executions for velocity calculation
      const { data: trades, error: tradesError } = await supabase
        .from("trade_executions")
        .select("*")
        .gte("execution_time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("execution_time", { ascending: false });

      if (tradesError) throw tradesError;

      const totalTradingVolume = trades.reduce((sum, trade) => sum + Number(trade.total_value), 0);
      const velocity = totalMarketCap > 0 ? totalTradingVolume / totalMarketCap : 0;

      setMetrics({
        totalSupply: assets.reduce((sum, asset) => sum + Number(asset.total_supply), 0),
        circulatingSupply: assets.reduce((sum, asset) => sum + Number(asset.circulating_supply), 0),
        velocity,
        marketCap: totalMarketCap,
        volume24h: totalVolume,
        priceChange24h: avgPriceChange,
        activeTokens: assets.length,
        totalTransactions: trades.length,
      });

      // Process velocity data for charts
      const velocityDataPoints: VelocityData[] = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourTrades = trades.filter(trade => {
          const tradeTime = new Date(trade.execution_time);
          return tradeTime >= timestamp && tradeTime < new Date(timestamp.getTime() + 60 * 60 * 1000);
        });
        
        const hourVolume = hourTrades.reduce((sum, trade) => sum + Number(trade.total_value), 0);
        const hourVelocity = totalMarketCap > 0 ? hourVolume / totalMarketCap : 0;
        
        velocityDataPoints.push({
          timestamp: timestamp.toISOString(),
          velocity: hourVelocity,
          volume: hourVolume,
        });
      }
      setVelocityData(velocityDataPoints);

      // Process supply analytics
      const supplyData: SupplyAnalytics[] = assets.map(asset => ({
        tokenSymbol: asset.asset_symbol,
        totalSupply: Number(asset.total_supply),
        circulatingSupply: Number(asset.circulating_supply),
        lockedTokens: Number(asset.total_supply) - Number(asset.circulating_supply),
        distributionBreakdown: {
          public: Number(asset.circulating_supply) * 0.6,
          team: Number(asset.total_supply) * 0.15,
          treasury: Number(asset.total_supply) * 0.15,
          ecosystem: Number(asset.total_supply) * 0.1,
        },
      }));
      setSupplyAnalytics(supplyData);

    } catch (err) {
      console.error("Error fetching tokenomics data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tokenomics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenomicsData();

    // Set up real-time subscriptions for market data updates
    const channel = supabase
      .channel("tokenomics-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "market_data",
        },
        () => {
          fetchTokenomicsData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trade_executions",
        },
        () => {
          fetchTokenomicsData();
        }
      )
      .subscribe();

    // Trigger market data update
    const updateMarketData = async () => {
      try {
        await supabase.functions.invoke("market-data-scheduler");
      } catch (error) {
        console.error("Failed to trigger market data update:", error);
      }
    };
    updateMarketData();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    metrics,
    velocityData,
    supplyAnalytics,
    loading,
    error,
    refetch: fetchTokenomicsData,
  };
}