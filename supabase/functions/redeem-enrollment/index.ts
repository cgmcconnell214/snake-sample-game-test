// Redeem an enrollment link to enroll a user for free with usage limits
// Uses service role to safely update usage counts and create enrollments
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = await rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  const service = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      throw new Error("Not authenticated");
    }

    const { code } = await req.json();
    if (!code) throw new Error("Missing code");

    // Use atomic function for thread-safe redemption
    const { data: result, error: redeemErr } = await service.rpc(
      'redeem_enrollment_link_atomic',
      {
        p_code: code,
        p_user_id: userData.user.id
      }
    );

    if (redeemErr) throw new Error(`RPC error: ${redeemErr.message}`);
    if (!result) throw new Error("No result from redemption function");

    // Check if the atomic function succeeded
    if (!result.success) {
      throw new Error(result.error || "Redemption failed");
    }

    console.log('Redemption successful:', {
      course_id: result.course_id,
      already_enrolled: result.already_enrolled,
      used_count: result.used_count,
      max_uses: result.max_uses
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        course_id: result.course_id,
        already_enrolled: result.already_enrolled,
        used_count: result.used_count,
        max_uses: result.max_uses
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
