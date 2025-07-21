import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TradingChart } from "@/components/TradingChart"
import { OrderBook } from "@/components/OrderBook"
import { TradePanel } from "@/components/TradePanel"
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Volume2,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react"

const marketData = [
  {
    symbol: "GOLD-TOKEN",
    name: "Premium Gold Bars",
    price: 131.20,
    change: 2.4,
    volume: 1250000,
    marketCap: 164000000,
    type: "commodity",
    status: "active"
  },
  {
    symbol: "SILVER-TOKEN", 
    name: "Silver Bullion",
    price: 10.15,
    change: -1.2,
    volume: 890000,
    marketCap: 8630000,
    type: "commodity",
    status: "active"
  },
  {
    symbol: "OIL-FUTURE",
    name: "Crude Oil Futures Q1",
    price: 84.50,
    change: 5.7,
    volume: 2100000,
    marketCap: 42250000,
    type: "derivative",
    status: "active"
  },
  {
    symbol: "REAL-ESTATE-A",
    name: "Manhattan Office Complex",
    price: 2500.00,
    change: 1.8,
    volume: 150000,
    marketCap: 25000000,
    type: "real-estate",
    status: "pending"
  },
  {
    symbol: "TECH-EQUITY-B",
    name: "Tech Startup Equity B",
    price: 45.75,
    change: -3.2,
    volume: 567000,
    marketCap: 4575000,
    type: "equity",
    status: "active"
  }
]

const openOrders = [
  {
    id: "ORD001",
    symbol: "GOLD-TOKEN",
    type: "LIMIT_BUY",
    quantity: 25,
    price: 130.50,
    filled: 0,
    status: "open",
    time: "2024-01-15 14:23:15"
  },
  {
    id: "ORD002", 
    symbol: "SILVER-TOKEN",
    type: "LIMIT_SELL",
    quantity: 100,
    price: 10.25,
    filled: 0,
    status: "open",
    time: "2024-01-15 13:45:30"
  },
  {
    id: "ORD003",
    symbol: "OIL-FUTURE",
    type: "STOP_LOSS",
    quantity: 10,
    price: 82.00,
    filled: 0,
    status: "pending",
    time: "2024-01-15 12:12:08"
  }
]

export default function Trading() {
  const [selectedSymbol, setSelectedSymbol] = useState("GOLD-TOKEN")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  const filteredMarketData = marketData.filter(item => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || item.type === filterType
    return matchesSearch && matchesFilter
  })

  const selectedAsset = marketData.find(item => item.symbol === selectedSymbol)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading Platform</h1>
          <p className="text-muted-foreground">Advanced trading interface for tokenized assets</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-success border-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Market Open
          </Badge>
          <Badge variant="outline" className="text-primary border-primary">
            <Volume2 className="h-3 w-3 mr-1" />
            Real-time Data
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Market Overview */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Markets</CardTitle>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="commodity">Commodities</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="derivative">Derivatives</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredMarketData.map((asset) => (
              <div
                key={asset.symbol}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSymbol === asset.symbol 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'bg-muted/20 hover:bg-muted/30'
                }`}
                onClick={() => setSelectedSymbol(asset.symbol)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">{asset.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate">{asset.name}</div>
                  </div>
                  <Badge 
                    variant={asset.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {asset.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold">${asset.price.toFixed(2)}</span>
                  <div className={`flex items-center gap-1 text-xs ${
                    asset.change >= 0 ? 'text-buy' : 'text-sell'
                  }`}>
                    {asset.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {asset.change >= 0 ? '+' : ''}{asset.change}%
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground">
                  Vol: ${(asset.volume / 1000000).toFixed(1)}M
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Main Trading Area */}
        <div className="xl:col-span-2 space-y-6">
          {selectedAsset && (
            <TradingChart 
              symbol={selectedAsset.symbol}
              currentPrice={selectedAsset.price}
              change={selectedAsset.change}
            />
          )}

          {/* Open Orders */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Open Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground font-medium border-b border-border pb-2">
                  <div>Order ID</div>
                  <div>Symbol</div>
                  <div>Type</div>
                  <div>Quantity</div>
                  <div>Price</div>
                  <div>Status</div>
                  <div>Action</div>
                </div>
                {openOrders.map((order) => (
                  <div key={order.id} className="grid grid-cols-7 gap-2 text-sm py-2 hover:bg-muted/20 transition-colors rounded">
                    <div className="font-mono text-primary">{order.id}</div>
                    <div className="font-medium">{order.symbol}</div>
                    <div className={`text-xs ${
                      order.type.includes('BUY') ? 'text-buy' : 'text-sell'
                    }`}>
                      {order.type.replace('_', ' ')}
                    </div>
                    <div className="font-mono">{order.quantity}</div>
                    <div className="font-mono">${order.price}</div>
                    <div>
                      <Badge 
                        variant={order.status === 'open' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div>
                      <Button variant="ghost" size="sm" className="text-xs text-destructive">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
                {openOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    No open orders
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Panel & Order Book */}
        <div className="space-y-6">
          <TradePanel />
          <OrderBook />
          
          {/* Market Statistics */}
          {selectedAsset && (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Market Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Market Cap:</span>
                  <span className="font-mono">${(selectedAsset.marketCap / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">24h Volume:</span>
                  <span className="font-mono">${(selectedAsset.volume / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Asset Type:</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedAsset.type}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge 
                    variant={selectedAsset.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {selectedAsset.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}