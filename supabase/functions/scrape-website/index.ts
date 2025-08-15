import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

interface ScrapeRequestBody {
  url: string;
  limit?: number;
  formats?: ("markdown" | "html" | "rawHtml")[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = await rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  // Initialize Supabase client for authentication
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase configuration");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Require authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.log("Missing Authorization header for scrape request");
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const user = authData?.user;
  
  if (authError || !user) {
    console.log("Invalid authentication for scrape request:", authError?.message);
    return new Response(JSON.stringify({ error: "Invalid authentication" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ScrapeRequestBody;
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");

    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Server is missing Firecrawl API key" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!body?.url || typeof body.url !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid 'url' is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const limit =
      typeof body.limit === "number"
        ? Math.min(Math.max(body.limit, 1), 200)
        : 50;
    const formats =
      Array.isArray(body.formats) && body.formats.length > 0
        ? body.formats
        : ["markdown", "html"];

    // Log the scraping request
    console.log(`User ${user.id} requesting scrape of: ${body.url}`);
    
    // Call Firecrawl REST API
    const firecrawlRes = await fetch("https://api.firecrawl.dev/v1/crawl", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: body.url,
        limit,
        scrapeOptions: { formats },
      }),
    });

    const firecrawlData = await firecrawlRes.json().catch(() => ({}));

    // Log the result
    if (firecrawlRes.ok) {
      console.log(`Successful scrape for user ${user.id}: ${body.url} (${firecrawlData?.data?.length || 0} items)`);
    } else {
      console.error(`Failed scrape for user ${user.id}: ${body.url}`, firecrawlData);
    }

    if (!firecrawlRes.ok) {
      console.error("Firecrawl error:", firecrawlData);
      return new Response(
        JSON.stringify({
          error: "Failed to crawl site",
          details: firecrawlData?.error || firecrawlData,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: firecrawlData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("scrape-website unexpected error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: "Internal error", message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
