import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AssetWithMarketData {
  id: string;
  asset_symbol: string;
  asset_name: string;
  description: string;
  current_price: number;
  price_change_24h: number;
  volume_24h: number;
  market_cap: number;
  high_24h: number;
  low_24h: number;
  is_active: boolean;
  metadata: any;
}

export interface Order {
  id: string;
  asset_id: string;
  order_type: string;
  side: string;
  quantity: number;
  price: number;
  filled_quantity: number;
  remaining_quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useTradingData() {
  const [assets, setAssets] = useState<AssetWithMarketData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("tokenized_assets")
        .select(
          `
          id,
          asset_symbol,
          asset_name,
          description,
          is_active,
          metadata,
          market_data (
            current_price,
            price_change_24h,
            volume_24h,
            market_cap,
            high_24h,
            low_24h
          )
        `,
        )
        .eq("is_active", true);

      if (error) throw error;

      const assetsWithMarketData = data.map((asset) => ({
        ...asset,
        current_price: asset.market_data?.[0]?.current_price || 0,
        price_change_24h: asset.market_data?.[0]?.price_change_24h || 0,
        volume_24h: asset.market_data?.[0]?.volume_24h || 0,
        market_cap: asset.market_data?.[0]?.market_cap || 0,
        high_24h: asset.market_data?.[0]?.high_24h || 0,
        low_24h: asset.market_data?.[0]?.low_24h || 0,
      }));

      setAssets(assetsWithMarketData);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch market data",
        variant: "destructive",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", session.session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAssets(), fetchOrders()]);
      setLoading(false);
    };

    let assetsChannel: any;
    let ordersChannel: any;

    const setup = async () => {
      await loadData();

      // Market data updates can be frequent; listen only for UPDATEs
      assetsChannel = supabase
        .channel("assets-changes")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "market_data" },
          () => fetchAssets(),
        )
        .subscribe();

      // Scope orders realtime to current user to reduce DB load
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id;

      ordersChannel = supabase
        .channel("orders-changes")
        .on(
          "postgres_changes",
          userId
            ? {
                event: "*",
                schema: "public",
                table: "orders",
                filter: `user_id=eq.${userId}`,
              }
            : { event: "*", schema: "public", table: "orders" },
          () => fetchOrders(),
        )
        .subscribe();
    };

    setup();

    return () => {
      if (assetsChannel) supabase.removeChannel(assetsChannel);
      if (ordersChannel) supabase.removeChannel(ordersChannel);
    };
  }, []);

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Order Cancelled",
        description: "Your order has been successfully cancelled.",
      });

      fetchOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  return {
    assets,
    orders,
    loading,
    refetchAssets: fetchAssets,
    refetchOrders: fetchOrders,
    cancelOrder,
  };
}
