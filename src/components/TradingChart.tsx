import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ChartDataPoint {
  time: string;
  price: number;
  volume: number;
}

const mockChartData: ChartDataPoint[] = [
  { time: "09:00", price: 125.5, volume: 1250 },
  { time: "09:30", price: 127.2, volume: 1890 },
  { time: "10:00", price: 124.8, volume: 2100 },
  { time: "10:30", price: 128.9, volume: 1750 },
  { time: "11:00", price: 132.4, volume: 2300 },
  { time: "11:30", price: 129.7, volume: 1680 },
  { time: "12:00", price: 131.2, volume: 1950 },
];

export function TradingChart({
  symbol = "GOLD-TOKEN",
  currentPrice = 131.2,
  change = 2.4,
}: {
  symbol?: string;
  currentPrice?: number;
  change?: number;
}): JSX.Element {
  const [timeframe, setTimeframe] = useState("1H");
  const isPositive = change >= 0;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl font-bold">{symbol}</CardTitle>
            <Badge variant="outline" className="text-xs">
              XRPL
            </Badge>
          </div>
          <div className="flex gap-1">
            {["1M", "5M", "1H", "1D", "1W"].map((tf) => (
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
          <div
            className={`flex items-center gap-1 ${isPositive ? "text-buy" : "text-sell"}`}
          >
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
        <div className="h-64 relative">
          {/* Simple SVG Chart */}
          <svg className="w-full h-full" viewBox="0 0 400 200">
            <defs>
              <linearGradient
                id="priceGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.0"
                />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="0"
                y1={40 * i}
                x2="400"
                y2={40 * i}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                opacity="0.5"
              />
            ))}

            {/* Price line */}
            <polyline
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              points={mockChartData
                .map(
                  (point, i) =>
                    `${(i * 400) / (mockChartData.length - 1)},${200 - ((point.price - 120) / 15) * 200}`,
                )
                .join(" ")}
            />

            {/* Fill area */}
            <polygon
              fill="url(#priceGradient)"
              points={`0,200 ${mockChartData
                .map(
                  (point, i) =>
                    `${(i * 400) / (mockChartData.length - 1)},${200 - ((point.price - 120) / 15) * 200}`,
                )
                .join(" ")} 400,200`}
            />
          </svg>

          {/* Volume bars at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end gap-1">
            {mockChartData.map((point, i) => (
              <div
                key={i}
                className="flex-1 bg-muted/30 rounded-t"
                style={{ height: `${(point.volume / 2500) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
