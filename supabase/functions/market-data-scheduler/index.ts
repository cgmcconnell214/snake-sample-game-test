import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MARKET-SCHEDULER] ${step}${detailsStr}`);
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
    { auth: { persistSession: false } }
  );

  try {
    logStep("Market data scheduler triggered");

    // Check if we should update market data (every 30 seconds for real-time feel)
    const now = new Date();
    const lastUpdate = new Date(Date.now() - 30000); // 30 seconds ago

    // Get market data that hasn't been updated in the last 30 seconds
    const { data: outdatedData, error: queryError } = await supabaseClient
      .from('market_data')
      .select('asset_id, last_updated')
      .lt('last_updated', lastUpdate.toISOString());

    if (queryError) throw queryError;

    if (outdatedData.length === 0) {
      return new Response(JSON.stringify({
        message: "Market data is up to date",
        timestamp: now.toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Call the update-market-data function
    const { data: updateResult, error: updateError } = await supabaseClient.functions.invoke(
      'update-market-data',
      {
        body: { trigger: 'scheduler' }
      }
    );

    if (updateError) throw updateError;

    logStep("Market data update completed", { 
      updatedAssets: outdatedData.length,
      result: updateResult 
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Market data updated successfully",
      updatedAssets: outdatedData.length,
      timestamp: now.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in market scheduler", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});