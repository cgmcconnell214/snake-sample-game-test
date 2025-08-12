import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { injectContractTemplate } from "@/lib/contractTemplates";

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: {
    id: string;
    asset_name: string;
    asset_symbol: string;
    current_price: number;
  };
  side: "buy" | "sell";
}

export function OrderModal({ open, onOpenChange, asset, side }: OrderModalProps) {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(asset.current_price.toFixed(2));
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!quantity) {
      toast({
        title: "Missing Quantity",
        description: "Please enter a quantity",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await injectContractTemplate(side === "buy" ? "buy" : "sell");
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error("No session found");
      }

      const orderData = {
        asset_id: asset.id,
        order_type: "limit" as const,
        side,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
      };

      const { error } = await supabase.functions.invoke("create-order", {
        body: orderData,
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Order Created",
        description: `Your ${side} order for ${quantity} ${asset.asset_symbol} has been placed.`,
      });
      onOpenChange(false);
      setQuantity("");
      setPrice(asset.current_price.toFixed(2));
    } catch (err) {
      const e = err as Error;
      toast({
        title: "Order Failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {side === "buy" ? "Purchase" : "Sell"} {asset.asset_symbol}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-xs">Quantity</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">Price (USD)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              className="font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OrderModal;

