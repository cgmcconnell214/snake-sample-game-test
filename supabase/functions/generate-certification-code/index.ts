import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { getErrorResponse } from "../_shared/error.ts";
import { authorizeUser, AuthorizationError, createAuthorizationErrorResponse } from "../_shared/authorization.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = await rateLimit(req);
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
      requiredTier: "standard" // Certification generation requires standard subscription
    });

    const { certification_id } = await req.json();
    
    if (!certification_id) {
      return getErrorResponse(
        "MISSING_REQUIRED_FIELDS",
        "generate-certification-code",
        req,
        corsHeaders,
        { additionalContext: { missing: "certification_id" } }
      );
    }

    

    // Check if user already has this certification
    const { data: existing, error: existingError } = await supabaseClient
      .from("user_certifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("certification_id", certification_id)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing certification:", existingError);
      return getErrorResponse(
        "DATABASE_ERROR",
        "generate-certification-code",
        req,
        corsHeaders
      );
    }

    if (existing) {
      return getErrorResponse(
        "RESOURCE_CONFLICT",
        "generate-certification-code",
        req,
        corsHeaders,
        { additionalContext: { reason: "certification_already_earned" } }
      );
    }

    // Generate secure verification code using database function
    const { data: codeData, error: codeError } = await supabaseClient
      .rpc("generate_secure_verification_code");

    if (codeError) {
      console.error("Error generating verification code:", codeError);
      return getErrorResponse(
        "INTERNAL_ERROR",
        "generate-certification-code",
        req,
        corsHeaders
      );
    }

    const verificationCode = codeData;

    // Hash the code using database function
    const { data: hashedCode, error: hashError } = await supabaseClient
      .rpc("hash_verification_code", { code: verificationCode });

    if (hashError) {
      console.error("Error hashing verification code:", hashError);
      return getErrorResponse(
        "INTERNAL_ERROR",
        "generate-certification-code",
        req,
        corsHeaders
      );
    }

    // Create the certification record
    const { data: certification, error: certError } = await supabaseClient
      .from("user_certifications")
      .insert({
        user_id: user.id,
        certification_id,
        verification_code: verificationCode, // Store plaintext temporarily
        verification_code_hash: hashedCode,
        code_display_count: 0
      })
      .select(`
        *,
        certifications (*)
      `)
      .single();

    if (certError) {
      console.error("Error creating certification:", certError);
      return getErrorResponse(
        "DATABASE_ERROR",
        "generate-certification-code",
        req,
        corsHeaders
      );
    }

    // Log security event
    await supabaseClient.from("user_behavior_log").insert({
      user_id: user.id,
      action: "certification_earned",
      location_data: { origin: req.headers.get("origin") },
      risk_indicators: { certification_id, verification_method: "secure_generation" },
    });

    return new Response(
      JSON.stringify({
        success: true,
        certification,
        verification_code: verificationCode, // Return plaintext only once
        message: "Certification earned successfully! Save your verification code - it will only be shown once."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      },
    );

  } catch (error) {
    if (error instanceof AuthorizationError) {
      return createAuthorizationErrorResponse(error, corsHeaders);
    }
    
    console.error("Unexpected error in generate-certification-code:", error);
    return getErrorResponse(
      error,
      "generate-certification-code",
      req,
      corsHeaders
    );
  }
});