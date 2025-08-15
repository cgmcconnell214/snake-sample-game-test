import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { EdgeLogger } from "../logger-service/logger-utils.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const logger = new EdgeLogger("alert-service", req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, message, context, error, timestamp } = await req.json();

    logger.info(`Received alert: ${type} - ${message}`);

    // Store alert in database
    const { error: dbError } = await supabase
      .from('security_events')
      .insert({
        user_id: context.userId,
        event_type: type,
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
        device_fingerprint: context.sessionId,
        event_data: {
          message,
          context,
          error,
          timestamp,
          alert_level: 'critical',
        },
        risk_score: 10, // Critical alerts get max risk score
      });

    if (dbError) {
      logger.error("Failed to store alert in database", dbError);
    }

    // Send notification to admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins?.length) {
      const notifications = admins.map(admin => ({
        user_id: admin.user_id,
        type: 'critical_alert',
        title: `Critical System Alert: ${type}`,
        message: `${message} - Timestamp: ${timestamp}`,
        data: {
          alert_type: type,
          context,
          error,
        },
      }));

      await supabase.from('notifications').insert(notifications);
      logger.info(`Critical alert notifications sent to ${admins.length} admins`);
    }

    // Send to external alerting service (e.g., PagerDuty, Slack)
    if (Deno.env.get("SLACK_WEBHOOK_URL")) {
      try {
        await fetch(Deno.env.get("SLACK_WEBHOOK_URL")!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🚨 CRITICAL ALERT: ${message}`,
            attachments: [
              {
                color: "danger",
                fields: [
                  { title: "Type", value: type, short: true },
                  { title: "User", value: context.userId || "Anonymous", short: true },
                  { title: "Timestamp", value: timestamp, short: true },
                  { title: "IP Address", value: context.ipAddress || "Unknown", short: true },
                ],
              },
            ],
          }),
        });
        logger.info("Alert sent to Slack successfully");
      } catch (slackError) {
        logger.warn("Failed to send alert to Slack", slackError);
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
    logger.error("Error in alert service", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});