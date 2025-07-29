 codex/apply-eslint-typescript-rules
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function TradePanel(): JSX.Element {
  const [orderType, setOrderType] = useState("limit");
  const [side, setSide] = useState("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [selectedAsset, setSelectedAsset] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { injectContractTemplate } from "@/lib/contractTemplates"

export function TradePanel() {
  const [orderType, setOrderType] = useState("limit")
  const [side, setSide] = useState("buy")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [selectedAsset, setSelectedAsset] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
 main

  // Mock available assets - in real app, fetch from tokenized_assets table
  const availableAssets = [
    {
      id: "asset-1",
      symbol: "GOLD001",
      name: "Premium Gold Bars",
      price: 131.2,
    },
    { id: "asset-2", symbol: "SILVER01", name: "Silver Bullion", price: 10.15 },
    { id: "asset-3", symbol: "OIL-Q1", name: "Crude Oil Futures", price: 84.5 },
  ];

  const asset = availableAssets.find((a) => a.id === selectedAsset);
  const walletBalance = 50000;
  const availableTokens = asset ? 125 : 0;

  const handleCreateOrder = async () => {
    if (!selectedAsset || !quantity || (orderType !== "market" && !price)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await injectContractTemplate(side === 'buy' ? 'buy' : 'sell');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error("No session found");
      }

      const orderData = {
        asset_id: selectedAsset,
        order_type: orderType as
          | "market"
          | "limit"
          | "stop_loss"
          | "take_profit",
        side: side as "buy" | "sell",
        quantity: parseFloat(quantity),
        ...(orderType !== "market" && { price: parseFloat(price) }),
      };

      const { data, error } = await supabase.functions.invoke("create-order", {
        body: orderData,
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Order Created!",
        description: `${side.toUpperCase()} order for ${quantity} ${asset?.symbol} has been placed.`,
      });

      // Reset form
      setQuantity("");
      setPrice("");
 khfq01-codex/replace-instances-of-any-with-correct-types
      
    } catch (error: unknown) {
      console.error('Order creation error:', error);
      const message = (error as Error).message || 'Failed to create order. Please try again.';
      toast({
        title: "Order Failed",
        description: message,

 codex/apply-eslint-typescript-rules
    } catch (error: any) {
      console.error("Order creation error:", error);
      toast({
        title: "Order Failed",
        description:
          error.message || "Failed to create order. Please try again.",

      
    } catch (error: unknown) {
 xgqza0-codex/replace-instances-of-any-with-correct-types

 codex/replace-all-instances-of-any-in-codebase

 codex/replace-any-with-correct-typescript-types
      // TODO: Verify correct error type

 main
 main
 main
      console.error('Order creation error:', error);
      const err = error as Error;
      toast({
        title: "Order Failed",
 codex/replace-any-with-correct-typescript-types
        description: err.message || "Failed to create order. Please try again.",

 codex/replace-instances-of-any-with-correct-types
        description: err.message || "Failed to create order. Please try again.",

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        description: (error as any).message || "Failed to create order. Please try again.",
 main
 main
 main
 main
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!quantity || !asset) return "0.00";
    const orderPrice =
      orderType === "market" ? asset.price : parseFloat(price || "0");
    return (parseFloat(quantity) * orderPrice).toFixed(2);
  };

  const calculateFee = () => {
    const total = parseFloat(calculateTotal());
    return (total * 0.001).toFixed(2); // 0.1% fee
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Trade Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Select Asset</Label>
          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
            <SelectTrigger>
              <SelectValue placeholder="Choose asset to trade" />
            </SelectTrigger>
            <SelectContent>
              {availableAssets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{asset.symbol}</span>
                    <span className="text-muted-foreground ml-2">
                      ${asset.price}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={side} onValueChange={setSide} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="buy"
              className="text-buy data-[state=active]:bg-buy/20"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Buy
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              className="text-sell data-[state=active]:bg-sell/20"
            >
              <TrendingDown className="h-4 w-4 mr-1" />
              Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4 mt-4">
            <OrderForm side="buy" />
          </TabsContent>
          <TabsContent value="sell" className="space-y-4 mt-4">
            <OrderForm side="sell" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  function OrderForm({ side }: { side: string }) {
    return (
      <>
        <div>
          <Label className="text-xs">Order Type</Label>
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">Market Order</SelectItem>
              <SelectItem value="limit">Limit Order</SelectItem>
              <SelectItem value="stop_loss">Stop Loss</SelectItem>
              <SelectItem value="take_profit">Take Profit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {orderType !== "market" && (
          <div>
            <Label className="text-xs">Price (USD)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="font-mono"
              step="0.01"
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
            step="0.001"
          />
        </div>

        <div className="bg-muted/20 rounded p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Current Price:</span>
            <span className="font-mono">
              ${asset?.price.toFixed(2) || "0.00"}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Estimated Total:</span>
            <span className="font-mono">${calculateTotal()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {side === "buy" ? "Available Balance:" : "Available Tokens:"}
            </span>
            <span className="font-mono">
              {side === "buy"
                ? `$${walletBalance.toLocaleString()}`
                : `${availableTokens} ${asset?.symbol || ""}`}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Trading Fee (0.1%):</span>
            <span className="font-mono">${calculateFee()}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button
            className={`w-full ${side === "buy" ? "bg-buy hover:bg-buy/90" : "bg-sell hover:bg-sell/90"}`}
            size="lg"
            onClick={handleCreateOrder}
            disabled={!selectedAsset || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : (
              `${side === "buy" ? "Buy" : "Sell"} ${asset?.symbol || "Asset"}`
            )}
          </Button>
        </div>

        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <div className="font-medium text-warning mb-1">
                Compliance Notice
              </div>
              <div className="text-muted-foreground">
                All trades are subject to regulatory compliance checks and may
                require additional verification.
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
