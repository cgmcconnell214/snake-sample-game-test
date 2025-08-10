import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface OrderRow {
  side: "buy" | "sell" | string;
  price: number;
  quantity: number;
}

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export function OrderBook({ assetId, symbol }: { assetId?: string; symbol?: string }): JSX.Element {
  const [rawOrders, setRawOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    if (!assetId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("side, price, quantity")
      .eq("asset_id", assetId)
      .in("status", ["pending", "partial"]) // consider these as visible book levels
      .order("price", { ascending: true });

    if (!error) setRawOrders((data as OrderRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    if (!assetId) return;

    const channel = supabase
      .channel("orderbook-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId]);

  const { buyOrders, sellOrders } = useMemo(() => {
    const buys = new Map<number, number>();
    const sells = new Map<number, number>();

    for (const row of rawOrders) {
      if (!row.price || !row.quantity) continue;
      const p = Number(row.price);
      const q = Number(row.quantity);
      if ((row.side || "").toLowerCase() === "buy") {
        buys.set(p, (buys.get(p) || 0) + q);
      } else {
        sells.set(p, (sells.get(p) || 0) + q);
      }
    }

    const toEntries = (m: Map<number, number>): OrderBookEntry[] =>
      Array.from(m.entries())
        .map(([price, quantity]) => ({ price, quantity, total: price * quantity }))
        .sort((a, b) => a.price - b.price);

    return {
      buyOrders: toEntries(buys).sort((a, b) => b.price - a.price), // highest first
      sellOrders: toEntries(sells), // lowest first
    };
  }, [rawOrders]);

  const spread = useMemo(() => {
    if (!buyOrders.length || !sellOrders.length) return { value: 0, percent: 0 };
    const value = sellOrders[0].price - buyOrders[0].price;
    const percent = buyOrders[0].price ? (value / buyOrders[0].price) * 100 : 0;
    return { value, percent };
  }, [buyOrders, sellOrders]);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order Book</CardTitle>
          <Badge variant="outline" className="text-xs">
            {symbol || "Select Asset"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!assetId ? (
          <div className="text-center text-sm text-muted-foreground py-6">
            Select an asset to view the live order book.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground font-medium border-b border-border pb-2">
              <div className="text-right">Price (USD)</div>
              <div className="text-right">Quantity</div>
              <div className="text-right">Total</div>
            </div>

            {/* Sell Orders */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground mb-1">Sell Orders</div>
              {(sellOrders || []).slice(0, 15).map((order, i) => (
                <div
                  key={`ask-${order.price}-${i}`}
                  className="grid grid-cols-3 gap-2 text-xs font-mono hover:bg-sell/10 transition-colors p-1 rounded"
                >
                  <div className="text-right text-sell font-medium">${order.price.toFixed(2)}</div>
                  <div className="text-right text-foreground">{order.quantity}</div>
                  <div className="text-right text-muted-foreground">${order.total.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Spread */}
            <div className="bg-muted/20 rounded p-2 text-center">
              <div className="text-xs text-muted-foreground">Spread</div>
              <div className="font-mono font-medium">
                ${spread.value.toFixed(2)} ({spread.percent.toFixed(3)}%)
              </div>
            </div>

            {/* Buy Orders */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground mb-1">Buy Orders</div>
              {(buyOrders || []).slice(0, 15).map((order, i) => (
                <div
                  key={`bid-${order.price}-${i}`}
                  className="grid grid-cols-3 gap-2 text-xs font-mono hover:bg-buy/10 transition-colors p-1 rounded"
                >
                  <div className="text-right text-buy font-medium">${order.price.toFixed(2)}</div>
                  <div className="text-right text-foreground">{order.quantity}</div>
                  <div className="text-right text-muted-foreground">${order.total.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
