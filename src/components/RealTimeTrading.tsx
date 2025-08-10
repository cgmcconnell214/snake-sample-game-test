import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TradingChart } from "@/components/TradingChart";
import { OrderBook } from "@/components/OrderBook";
import { TradePanel } from "@/components/TradePanel";
import { useTradingData } from "@/hooks/useTradingData";
import { useMarketUpdates } from "@/hooks/useMarketUpdates";
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Volume2,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";

export default function RealTimeTrading(): JSX.Element {
  const { assets, orders, loading, cancelOrder } = useTradingData();
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Enable real-time market updates
  useMarketUpdates();

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.asset_symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = 
      filterType === "all" || 
      asset.metadata?.asset_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const selectedAsset = assets.find((asset) => asset.asset_symbol === selectedSymbol);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading trading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Trading Platform</h1>
          <p className="text-muted-foreground">
            Live trading interface for tokenized assets
          </p>
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
              <CardTitle className="text-lg">Live Markets</CardTitle>
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
                  <SelectItem value="intellectual_property">IP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                No assets found
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedSymbol === asset.asset_symbol
                      ? "bg-primary/20 border border-primary/30"
                      : "bg-muted/20 hover:bg-muted/30"
                  }`}
                  onClick={() => setSelectedSymbol(asset.asset_symbol)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm">{asset.asset_symbol}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {asset.asset_name}
                      </div>
                    </div>
                    <Badge
                      variant={asset.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {asset.is_active ? "active" : "inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">
                      ${asset.current_price.toFixed(2)}
                    </span>
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        asset.price_change_24h >= 0 ? "text-buy" : "text-sell"
                      }`}
                    >
                      {asset.price_change_24h >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {asset.price_change_24h >= 0 ? "+" : ""}
                      {asset.price_change_24h.toFixed(2)}%
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Vol: ${(asset.volume_24h / 1000000).toFixed(1)}M
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Main Trading Area */}
        <div className="xl:col-span-2 space-y-6">
          {selectedAsset ? (
            <TradingChart
              symbol={selectedAsset.asset_symbol}
              assetId={selectedAsset.id}
              currentPrice={selectedAsset.current_price}
              change={selectedAsset.price_change_24h}
            />
          ) : (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an asset to view its chart</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Orders */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Your Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground font-medium border-b border-border pb-2">
                  <div>Order ID</div>
                  <div>Asset</div>
                  <div>Type</div>
                  <div>Quantity</div>
                  <div>Price</div>
                  <div>Status</div>
                  <div>Action</div>
                </div>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    No orders yet
                  </div>
                ) : (
                  orders.slice(0, 10).map((order) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-7 gap-2 text-sm py-2 hover:bg-muted/20 transition-colors rounded"
                    >
                      <div className="font-mono text-primary text-xs">
                        {order.id.slice(0, 8)}...
                      </div>
                      <div className="font-medium">
                        {assets.find(a => a.id === order.asset_id)?.asset_symbol || 'Unknown'}
                      </div>
                      <div
                        className={`text-xs ${
                          order.side === "buy" ? "text-buy" : "text-sell"
                        }`}
                      >
                        {order.order_type.toUpperCase()} {order.side.toUpperCase()}
                      </div>
                      <div className="font-mono">{order.quantity}</div>
                      <div className="font-mono">${order.price?.toFixed(2) || 'Market'}</div>
                      <div>
                        <Badge
                          variant={
                            order.status === "pending" || order.status === "open" 
                              ? "default" 
                              : order.status === "filled"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div>
                        {(order.status === "pending" || order.status === "open") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-destructive"
                            onClick={() => cancelOrder(order.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
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
                  <span className="font-mono">
                    ${(selectedAsset.market_cap / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">24h Volume:</span>
                  <span className="font-mono">
                    ${(selectedAsset.volume_24h / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">24h High:</span>
                  <span className="font-mono text-buy">
                    ${selectedAsset.high_24h.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">24h Low:</span>
                  <span className="font-mono text-sell">
                    ${selectedAsset.low_24h.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Asset Type:</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedAsset.metadata?.asset_type || 'Unknown'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}