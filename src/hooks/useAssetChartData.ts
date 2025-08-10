import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AssetCandlePoint {
  t: string; // ISO time
  price: number;
  volume: number;
}

export function useAssetChartData(assetId?: string) {
  const [data, setData] = useState<AssetCandlePoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assetId) return;

    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("market_data")
        .select("current_price, volume_24h, created_at")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!isMounted) return;
      if (error) {
        console.error("Error loading chart data", error);
        setLoading(false);
        return;
      }
      const points = (data || []).map((d) => ({
        t: d.created_at as unknown as string,
        price: Number(d.current_price) || 0,
        volume: Number(d.volume_24h) || 0,
      }));
      setData(points);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`md-${assetId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_data", filter: `asset_id=eq.${assetId}` },
        (payload: any) => {
          const row: any = payload.new || payload.old;
          if (!row) return;
          setData((prev) => [
            ...prev,
            {
              t: row.created_at,
              price: Number(row.current_price) || 0,
              volume: Number(row.volume_24h) || 0,
            },
          ].slice(-300));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      isMounted = false;
    };
  }, [assetId]);

  return { data, loading };
}
