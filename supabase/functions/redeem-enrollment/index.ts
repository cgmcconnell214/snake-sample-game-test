// Redeem an enrollment link to enroll a user for free with usage limits
// Uses service role to safely update usage counts and create enrollments
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = rateLimit(req);
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

    // Load link by code
    const { data: link, error: linkErr } = await service
      .from("course_enrollment_links")
      .select(
        "id, course_id, creator_id, max_uses, used_count, expires_at, is_active",
      )
      .eq("code", code)
      .maybeSingle();

    if (linkErr) throw new Error(linkErr.message);
    if (!link) throw new Error("Invalid code");
    if (!link.is_active) throw new Error("Link is inactive");
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      throw new Error("Link expired");
    }
    if (link.used_count >= link.max_uses)
      throw new Error("Usage limit reached");

    // Check if already enrolled
    const { data: existing, error: existingErr } = await service
      .from("course_enrollments")
      .select("id")
      .eq("course_id", link.course_id)
      .eq("student_id", userData.user.id)
      .maybeSingle();
    if (existingErr) throw new Error(existingErr.message);

    if (!existing) {
      const { error: enrollErr } = await service
        .from("course_enrollments")
        .insert({
          student_id: userData.user.id,
          course_id: link.course_id,
          payment_amount: 0,
          payment_status: "paid",
          payment_provider: "bypass",
        });
      if (enrollErr) throw new Error(enrollErr.message);
    }

    // Increment usage
    const newCount = link.used_count + 1;
    const reached = newCount >= link.max_uses;
    const { error: updErr } = await service
      .from("course_enrollment_links")
      .update({
        used_count: newCount,
        is_active: reached ? false : link.is_active,
      })
      .eq("id", link.id);
    if (updErr) throw new Error(updErr.message);

    return new Response(
      JSON.stringify({ success: true, course_id: link.course_id }),
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
