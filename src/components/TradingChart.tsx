import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface ChartDataPoint {
  time: string
  price: number
  volume: number
}

function generateMockChartData(basePrice: number): ChartDataPoint[] {
  const points: ChartDataPoint[] = []
  for (let i = 0; i < 7; i++) {
    const time = `${9 + i * 0.5}:00`
    const price = basePrice + (Math.random() - 0.5) * 5
    const volume = 1500 + Math.random() * 1000
    points.push({ time, price, volume })
  }
  return points
}

export function TradingChart({ symbol = "GOLD-TOKEN", currentPrice = 131.20, change = 2.4 }: {
  symbol?: string
  currentPrice?: number
  change?: number
}) {
  const [timeframe, setTimeframe] = useState("1H")
  const [chartData, setChartData] = useState<ChartDataPoint[]>(() => generateMockChartData(currentPrice))
  const isPositive = change >= 0

  useEffect(() => {
    setChartData(generateMockChartData(currentPrice))
  }, [symbol, timeframe, currentPrice])

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
          <div className={`flex items-center gap-1 ${isPositive ? 'text-buy' : 'text-sell'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="font-mono text-sm">
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          {/* Simple SVG Chart */}
          <svg className="w-full h-full" viewBox="0 0 400 200">
            <defs>
              <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
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
              points={chartData.map((point, i) =>
                `${(i * 400) / (chartData.length - 1)},${200 - ((point.price - currentPrice) / 15 + 0.5) * 200}`
              ).join(' ')}
            />
            
            {/* Fill area */}
            <polygon
              fill="url(#priceGradient)"
              points={`0,200 ${chartData.map((point, i) =>
                `${(i * 400) / (chartData.length - 1)},${200 - ((point.price - currentPrice) / 15 + 0.5) * 200}`
              ).join(' ')} 400,200`}
            />
          </svg>
          
          {/* Volume bars at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end gap-1">
            {chartData.map((point, i) => (
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
  )
}