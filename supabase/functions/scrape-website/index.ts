import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScrapeRequestBody {
  url: string;
  limit?: number;
  formats?: ("markdown" | "html" | "rawHtml")[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
