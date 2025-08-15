import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { EdgeLogger } from "./logger-utils.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const logger = new EdgeLogger("logger-service", req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (user) {
        logger.setUser(user.id);
      }
    }

    const { level, message, context, timestamp, error } = await req.json();

    logger.debug(`Received log entry: ${level} - ${message}`);

    // Store log in database for aggregation
    const { error: dbError } = await supabase
      .from('application_logs')
      .insert({
        level,
        message,
        context,
        timestamp,
        error_data: error,
        user_id: context.userId,
        session_id: context.sessionId,
        request_id: context.requestId,
        component: context.component,
        function_name: context.function,
        metadata: context.metadata,
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
      });

    if (dbError) {
      logger.error("Failed to store log in database", dbError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to store log" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Send to external logging service (Logflare/Datadog equivalent)
    if (Deno.env.get("LOGFLARE_API_KEY")) {
      try {
        await fetch("https://api.logflare.app/logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": Deno.env.get("LOGFLARE_API_KEY")!,
          },
          body: JSON.stringify({
            source_token: Deno.env.get("LOGFLARE_SOURCE_TOKEN"),
            log_entry: {
              level,
              message,
              context,
              timestamp,
              error,
            },
          }),
        });
        logger.debug("Log sent to Logflare successfully");
      } catch (logflareError) {
        logger.warn("Failed to send log to Logflare", logflareError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    logger.error("Error in logger service", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});