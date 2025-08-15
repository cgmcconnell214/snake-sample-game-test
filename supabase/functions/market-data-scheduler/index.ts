import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { EdgeLogger } from "../_shared/logger-utils.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

// Authorization check helper
const isAuthorized = (req: Request): boolean => {
  const authHeader = req.headers.get("Authorization");
  const apiKey = req.headers.get("X-API-Key");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  // Check for service role key in Authorization header
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return token === serviceRoleKey;
  }
  
  // Check for API key in X-API-Key header
  if (apiKey) {
    return apiKey === serviceRoleKey;
  }
  
  return false;
};

serve(async (req) => {
  const logger = new EdgeLogger("market-data-scheduler", req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authorization check
  if (!isAuthorized(req)) {
    const clientIP = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
    
    logger.security("unauthorized_scheduler_access", {
      ip: clientIP,
      userAgent: req.headers.get("user-agent"),
      path: "/market-data-scheduler",
      method: req.method
    });

    return new Response(
      JSON.stringify({
        error: "Unauthorized access. This endpoint requires proper authentication.",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      },
    );
  }

  const rateLimitResponse = await rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    logger.info("Market data scheduler triggered", { authorized: true });

    // Check if we should update market data (every 30 seconds for real-time feel)
    const now = new Date();
    const lastUpdate = new Date(Date.now() - 30000); // 30 seconds ago

    // Get market data that hasn't been updated in the last 30 seconds
    const { data: outdatedData, error: queryError } = await supabaseClient
      .from("market_data")
      .select("asset_id, last_updated")
      .lt("last_updated", lastUpdate.toISOString());

    if (queryError) throw queryError;

    if (outdatedData.length === 0) {
      return new Response(
        JSON.stringify({
          message: "Market data is up to date",
          timestamp: now.toISOString(),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Call the update-market-data function
    const { data: updateResult, error: updateError } =
      await supabaseClient.functions.invoke("update-market-data", {
        body: { trigger: "scheduler" },
      });

    if (updateError) throw updateError;

    logger.info("Market data update completed", {
      updatedAssets: outdatedData.length,
      result: updateResult,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Market data updated successfully",
        updatedAssets: outdatedData.length,
        timestamp: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("ERROR in market scheduler", error instanceof Error ? error : new Error(errorMessage));

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
