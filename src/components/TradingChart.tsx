import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAssetChartData } from "@/hooks/useAssetChartData";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function TradingChart({
  symbol,
  assetId,
  currentPrice = 0,
  change = 0,
}: {
  symbol: string;
  assetId?: string;
  currentPrice?: number;
  change?: number;
}): JSX.Element {
  const [timeframe, setTimeframe] = useState("1D");
  const { data } = useAssetChartData(assetId);
  const isPositive = change >= 0;

  const tfMinutes = {
    "1H": 60,
    "4H": 240,
    "1D": 1440,
    "1W": 10080,
  } as const;

  const chartData = useMemo(() => {
    if (!data.length) return [] as any[];
    const cutoffMin = tfMinutes[timeframe as keyof typeof tfMinutes] || 1440;
    const cutoffTime = Date.now() - cutoffMin * 60 * 1000;
    return data
      .filter((d) => new Date(d.t).getTime() >= cutoffTime)
      .map((d) => ({
        time: new Date(d.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        price: d.price,
        volume: d.volume,
      }));
  }, [data, timeframe]);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-bold">{symbol}</CardTitle>
            <Badge variant="outline" className="text-xs">
              Live
            </Badge>
          </div>
          <div className="flex gap-1">
            {["1H", "4H", "1D", "1W"].map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className="text-xs px-2"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-mono font-bold">
            ${currentPrice.toFixed(2)}
          </span>
          <div className={`flex items-center gap-1 ${isPositive ? "text-buy" : "text-sell"}`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="font-mono text-sm">
              {isPositive ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={48} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#priceFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
