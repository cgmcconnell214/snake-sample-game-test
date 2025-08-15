import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getErrorResponse } from "../_shared/error.ts";
import { authorizeUser, AuthorizationError, createAuthorizationErrorResponse } from "../_shared/authorization.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

// Strict rate limit for code reveals - only 3 attempts per hour per user
const REVEAL_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  maxDisplaysPerCertification: 5 // Maximum times a code can be displayed
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply strict rate limiting
  const rateLimitResponse = await rateLimit(req, undefined, REVEAL_RATE_LIMIT.maxAttempts);
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    // Authorize user with role/tier requirements
    const authHeader = req.headers.get("Authorization");
    const { user, profile } = await authorizeUser(supabaseClient, authHeader, {
      requiredTier: "standard" // Code reveal requires standard subscription
    });

    const { certification_id } = await req.json();
    
    if (!certification_id) {
      return getErrorResponse(
        "MISSING_REQUIRED_FIELDS",
        "reveal-verification-code",
        req,
        corsHeaders
      );
    }

    

    // Get the certification with current display count
    const { data: certification, error: certError } = await supabaseClient
      .from("user_certifications")
      .select("id, verification_code, code_display_count, certifications(name)")
      .eq("user_id", user.id)
      .eq("certification_id", certification_id)
      .single();

    if (certError || !certification) {
      return getErrorResponse(
        "RESOURCE_NOT_FOUND",
        "reveal-verification-code",
        req,
        corsHeaders,
        { additionalContext: { reason: "certification_not_found" } }
      );
    }

    // Check if the code has been displayed too many times
    if (certification.code_display_count >= REVEAL_RATE_LIMIT.maxDisplaysPerCertification) {
      // Log suspicious activity
      await supabaseClient.from("security_events").insert({
        user_id: user.id,
        event_type: "excessive_code_reveal_attempts",
        event_data: {
          certification_id,
          display_count: certification.code_display_count,
          max_allowed: REVEAL_RATE_LIMIT.maxDisplaysPerCertification
        },
        risk_score: 7
      });

      return getErrorResponse(
        "SECURITY_VIOLATION",
        "reveal-verification-code",
        req,
        corsHeaders,
        { additionalContext: { 
          reason: "max_displays_exceeded",
          display_count: certification.code_display_count,
          max_allowed: REVEAL_RATE_LIMIT.maxDisplaysPerCertification
        }}
      );
    }

    // Increment display count and update last displayed timestamp
    const { error: updateError } = await supabaseClient
      .from("user_certifications")
      .update({
        code_display_count: certification.code_display_count + 1,
        last_displayed_at: new Date().toISOString()
      })
      .eq("id", certification.id);

    if (updateError) {
      console.error("Error updating display count:", updateError);
      return getErrorResponse(
        "DATABASE_ERROR",
        "reveal-verification-code",
        req,
        corsHeaders
      );
    }

    // Log the code reveal event
    await supabaseClient.from("user_behavior_log").insert({
      user_id: user.id,
      action: "verification_code_revealed",
      location_data: { origin: req.headers.get("origin") },
      risk_indicators: { 
        certification_id,
        display_count: certification.code_display_count + 1,
        certification_name: certification.certifications?.name
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        verification_code: certification.verification_code,
        display_count: certification.code_display_count + 1,
        max_displays: REVEAL_RATE_LIMIT.maxDisplaysPerCertification,
        warning: certification.code_display_count + 1 >= REVEAL_RATE_LIMIT.maxDisplaysPerCertification - 1 
          ? "This is one of your last chances to view this code. Please save it securely."
          : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );

  } catch (error) {
    if (error instanceof AuthorizationError) {
      return createAuthorizationErrorResponse(error, corsHeaders);
    }
    
    console.error("Unexpected error in reveal-verification-code:", error);
    return getErrorResponse(
      error,
      "reveal-verification-code",
      req,
      corsHeaders
    );
  }
});