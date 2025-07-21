import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Wallet, AlertCircle } from "lucide-react"

export function TradePanel() {
  const [orderType, setOrderType] = useState("market")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  
  const currentPrice = 131.20
  const walletBalance = 50000
  const availableTokens = 125

  const estimatedTotal = quantity && price ? parseFloat(quantity) * parseFloat(price) : 0
  const estimatedMarketTotal = quantity ? parseFloat(quantity) * currentPrice : 0

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Trade GOLD-TOKEN
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="data-[state=active]:bg-buy/20 data-[state=active]:text-buy">
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="data-[state=active]:bg-sell/20 data-[state=active]:text-sell">
              Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Order Type</Label>
                <Select value={orderType} onValueChange={setOrderType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market Order</SelectItem>
                    <SelectItem value="limit">Limit Order</SelectItem>
                    <SelectItem value="stop">Stop Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === "limit" && (
                <div>
                  <Label className="text-xs">Price (USD)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="bg-muted/20 rounded p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Estimated Total:</span>
                  <span className="font-mono">
                    ${orderType === "market" ? estimatedMarketTotal.toFixed(2) : estimatedTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Available Balance:</span>
                  <span className="font-mono">${walletBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Trading Fee (0.1%):</span>
                  <span className="font-mono">
                    ${((orderType === "market" ? estimatedMarketTotal : estimatedTotal) * 0.001).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button className="w-full bg-buy hover:bg-buy/80 text-white" size="lg">
                Place Buy Order
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Order Type</Label>
                <Select value={orderType} onValueChange={setOrderType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market Order</SelectItem>
                    <SelectItem value="limit">Limit Order</SelectItem>
                    <SelectItem value="stop">Stop Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === "limit" && (
                <div>
                  <Label className="text-xs">Price (USD)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="bg-muted/20 rounded p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Estimated Total:</span>
                  <span className="font-mono">
                    ${orderType === "market" ? estimatedMarketTotal.toFixed(2) : estimatedTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Available Tokens:</span>
                  <span className="font-mono">{availableTokens} GOLD-TOKEN</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Trading Fee (0.1%):</span>
                  <span className="font-mono">
                    ${((orderType === "market" ? estimatedMarketTotal : estimatedTotal) * 0.001).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button className="w-full bg-sell hover:bg-sell/80 text-white" size="lg">
                Place Sell Order
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <div className="font-medium text-warning mb-1">Compliance Notice</div>
              <div className="text-muted-foreground">
                All trades are subject to regulatory compliance checks and may require additional verification.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}