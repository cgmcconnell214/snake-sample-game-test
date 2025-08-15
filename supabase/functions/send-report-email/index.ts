import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

interface EmailRequest {
  recipientEmail: string;
  reportName: string;
  reportData: any;
  reportType: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const startTime = Date.now();
    console.log("[SEND-REPORT-EMAIL] Function started");

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Get user from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const { recipientEmail, reportName, reportData, reportType }: EmailRequest =
      await req.json();

    console.log("[SEND-REPORT-EMAIL] Sending report email", {
      recipientEmail,
      reportName,
      reportType,
    });

    // Create a message in the user_messages table
    const { error: messageError } = await supabaseAdmin
      .from("user_messages")
      .insert({
        sender_id: null, // System message
        recipient_id: userData.user.id,
        subject: `${reportName} - Generated Report`,
        content: `Your ${reportName} has been generated and is attached to this message.`,
        message_type: "report",
        attachments: JSON.stringify([
          {
            name: `${reportName}.pdf`,
            type: "application/pdf",
            data: reportData,
            generated_at: new Date().toISOString(),
          },
        ]),
      });

    if (messageError) {
      console.error(
        "[SEND-REPORT-EMAIL] Error creating message:",
        messageError,
      );
      throw messageError;
    }

    // In a real implementation, you would integrate with an email service like Resend
    // For now, we'll simulate sending the email
    console.log("[SEND-REPORT-EMAIL] Email sent successfully (simulated)");

    const execTime = Date.now() - startTime;
    console.log(`[SEND-REPORT-EMAIL] Execution time: ${execTime}ms`);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Report sent to message center successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const execTime = Date.now() - startTime;
    console.error("[SEND-REPORT-EMAIL] Error:", error);
    console.log(`[SEND-REPORT-EMAIL] Execution time: ${execTime}ms`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
