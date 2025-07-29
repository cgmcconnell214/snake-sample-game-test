import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

const mockBuyOrders: OrderBookEntry[] = [
  { price: 131.15, quantity: 250, total: 32787.5 },
  { price: 131.1, quantity: 180, total: 23598 },
  { price: 131.05, quantity: 320, total: 41936 },
  { price: 131.0, quantity: 150, total: 19650 },
  { price: 130.95, quantity: 200, total: 26190 },
  { price: 130.9, quantity: 175, total: 22907.5 },
  { price: 130.85, quantity: 300, total: 39255 },
];

const mockSellOrders: OrderBookEntry[] = [
  { price: 131.25, quantity: 180, total: 23625 },
  { price: 131.3, quantity: 220, total: 28886 },
  { price: 131.35, quantity: 160, total: 21016 },
  { price: 131.4, quantity: 190, total: 24966 },
  { price: 131.45, quantity: 240, total: 31548 },
  { price: 131.5, quantity: 170, total: 22355 },
  { price: 131.55, quantity: 200, total: 26310 },
];

export function OrderBook(): JSX.Element {
  const spread = mockSellOrders[0].price - mockBuyOrders[0].price;
  const spreadPercent = (spread / mockBuyOrders[0].price) * 100;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order Book</CardTitle>
          <Badge variant="outline" className="text-xs">
            GOLD-TOKEN
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header */}
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground font-medium border-b border-border pb-2">
          <div className="text-right">Price (USD)</div>
          <div className="text-right">Quantity</div>
          <div className="text-right">Total</div>
        </div>

        {/* Sell Orders */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground mb-1">Sell Orders</div>
          {mockSellOrders.reverse().map((order, i) => (
            <div
              key={i}
              className="grid grid-cols-3 gap-2 text-xs font-mono hover:bg-sell/10 transition-colors p-1 rounded"
            >
              <div className="text-right text-sell font-medium">
                ${order.price.toFixed(2)}
              </div>
              <div className="text-right text-foreground">{order.quantity}</div>
              <div className="text-right text-muted-foreground">
                ${order.total.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="bg-muted/20 rounded p-2 text-center">
          <div className="text-xs text-muted-foreground">Spread</div>
          <div className="font-mono font-medium">
            ${spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)
          </div>
        </div>

        {/* Buy Orders */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground mb-1">Buy Orders</div>
          {mockBuyOrders.map((order, i) => (
            <div
              key={i}
              className="grid grid-cols-3 gap-2 text-xs font-mono hover:bg-buy/10 transition-colors p-1 rounded"
            >
              <div className="text-right text-buy font-medium">
                ${order.price.toFixed(2)}
              </div>
              <div className="text-right text-foreground">{order.quantity}</div>
              <div className="text-right text-muted-foreground">
                ${order.total.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
