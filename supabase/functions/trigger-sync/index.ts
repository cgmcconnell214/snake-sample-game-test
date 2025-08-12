import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Basic rate limiting
  const limited = rateLimit(req);
  if (limited) return limited;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a sync event and simulate progress updates
    const { data: created, error: insertError } = await supabase
      .from("sync_events")
      .insert({ status: "in_progress", progress: 0 })
      .select("id")
      .single();

    if (insertError) throw insertError;

    const syncId = created.id as string;

    // Simulate a short-running sync with incremental updates
    const steps = [25, 50, 75, 100];
    for (const p of steps) {
      await sleep(400);
      const isDone = p >= 100;
      const { error: updErr } = await supabase
        .from("sync_events")
        .update({ progress: p, status: isDone ? "completed" : "in_progress" })
        .eq("id", syncId);
      if (updErr) throw updErr;
    }

    return new Response(JSON.stringify({ success: true, id: syncId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
