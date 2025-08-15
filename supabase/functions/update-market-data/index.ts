import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[UPDATE-MARKET-DATA] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    logStep("Starting market data update");

    // Get all active assets
    const { data: assets, error: assetsError } = await supabaseClient
      .from("tokenized_assets")
      .select("id, asset_symbol")
      .eq("is_active", true);

    if (assetsError) throw assetsError;

    // Update market data for each asset
    for (const asset of assets) {
      // Get current market data
      const { data: currentData, error: currentError } = await supabaseClient
        .from("market_data")
        .select("*")
        .eq("asset_id", asset.id)
        .single();

      if (currentError && currentError.code !== "PGRST116") {
        throw currentError;
      }

      // Generate realistic price movement (+-2% max)
      const currentPrice = currentData?.current_price || 5.0;
      const priceChange = (Math.random() - 0.5) * 0.04; // +-2%
      const newPrice = Math.max(0.01, currentPrice * (1 + priceChange));

      // Calculate 24h change
      const priceChange24h = ((newPrice - currentPrice) / currentPrice) * 100;

      // Generate volume (random but realistic)
      const baseVolume = currentData?.volume_24h || 100000;
      const volumeChange = (Math.random() - 0.5) * 0.2; // +-10%
      const newVolume = Math.max(1000, baseVolume * (1 + volumeChange));

      // Update high/low
      const high24h = Math.max(currentData?.high_24h || newPrice, newPrice);
      const low24h = Math.min(currentData?.low_24h || newPrice, newPrice);

      // Calculate market cap (simplified)
      const marketCap = newPrice * 1000000; // Assume 1M total supply

      const updateData = {
        current_price: newPrice,
        price_change_24h: priceChange24h,
        volume_24h: newVolume,
        market_cap: marketCap,
        high_24h,
        low_24h,
        last_updated: new Date().toISOString(),
      };

      if (currentData) {
        // Update existing data
        const { error: updateError } = await supabaseClient
          .from("market_data")
          .update(updateData)
          .eq("asset_id", asset.id);

        if (updateError) throw updateError;
      } else {
        // Insert new data
        const { error: insertError } = await supabaseClient
          .from("market_data")
          .insert({
            asset_id: asset.id,
            ...updateData,
          });

        if (insertError) throw insertError;
      }

      logStep(`Updated market data for ${asset.asset_symbol}`, {
        price: newPrice.toFixed(2),
        change: priceChange24h.toFixed(2) + "%",
      });
    }

    logStep("Market data update completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        updated_assets: assets.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in update-market-data", { message: errorMessage });

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
