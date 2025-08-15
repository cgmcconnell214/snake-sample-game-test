import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { EdgeLogger } from "../_shared/logger-utils.ts";
import { createUrlValidator } from "../_shared/url-validator.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

interface ScrapeRequestBody {
  url: string;
  limit?: number;
  formats?: ("markdown" | "html" | "rawHtml")[];
}

serve(async (req) => {
  const logger = new EdgeLogger("scrape-website", req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = await rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  // Initialize Supabase client for authentication
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    logger.error("Missing Supabase configuration");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Require authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    logger.warn("Missing Authorization header for scrape request");
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const user = authData?.user;
  
  if (authError || !user) {
    logger.warn("Invalid authentication for scrape request", { error: authError?.message });
    return new Response(JSON.stringify({ error: "Invalid authentication" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  logger.setUser(user.id);

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
      logger.error("FIRECRAWL_API_KEY is not set");
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

    // Enhanced URL validation with security checks
    const urlValidator = createUrlValidator(logger, {
      // Custom validation options for scraping
      allowedDomains: [], // Empty means all domains allowed (but with other restrictions)
      maxContentLength: 25 * 1024 * 1024, // 25MB limit
      timeout: 20000, // 20 second timeout
    });

    const clientInfo = {
      ip: req.headers.get("cf-connecting-ip") || 
          req.headers.get("x-forwarded-for") || 
          req.headers.get("x-real-ip") || "unknown",
      userAgent: req.headers.get("user-agent"),
      userId: user.id
    };

    // Validate URL with comprehensive security checks
    const urlValidation = await urlValidator.validateUrl(body.url, clientInfo);
    if (!urlValidation.isValid) {
      // Log validation failure for monitoring
      await supabaseAdmin.rpc('log_validation_failure', {
        p_user_id: user.id,
        p_failure_type: 'url_validation',
        p_details: {
          url: body.url,
          error: urlValidation.error,
          reason: urlValidation.reason
        },
        p_client_info: clientInfo
      });

      logger.security("url_validation_failed", {
        url: body.url,
        error: urlValidation.error,
        userId: user.id,
        clientInfo
      });

      return new Response(
        JSON.stringify({ 
          error: "URL validation failed", 
          details: urlValidation.error 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Additional pre-flight check with HEAD request to validate accessibility
    const preflightCheck = await urlValidator.validateAndFetch(body.url, clientInfo);
    if (!preflightCheck.isValid) {
      await supabaseAdmin.rpc('log_validation_failure', {
        p_user_id: user.id,
        p_failure_type: 'preflight_check',
        p_details: {
          url: body.url,
          error: preflightCheck.error
        },
        p_client_info: clientInfo
      });

      return new Response(
        JSON.stringify({ 
          error: "URL accessibility check failed", 
          details: preflightCheck.error 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const limit =
      typeof body.limit === "number"
        ? Math.min(Math.max(body.limit, 1), 100) // Reduced max limit from 200 to 100
        : 25; // Reduced default from 50 to 25
    const formats =
      Array.isArray(body.formats) && body.formats.length > 0
        ? body.formats
        : ["markdown", "html"];

    // Log the scraping request
    logger.info(`User requesting scrape`, { 
      url: body.url, 
      limit, 
      formats,
      userId: user.id 
    });
    
    // Call Firecrawl REST API with timeout and content limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const firecrawlRes = await fetch("https://api.firecrawl.dev/v1/crawl", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: body.url,
          limit,
          scrapeOptions: { 
            formats,
            onlyMainContent: true, // Focus on main content for security
            includeHtml: false, // Disable raw HTML to prevent XSS
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const firecrawlData = await firecrawlRes.json().catch(() => ({}));

      // Log the result
      if (firecrawlRes.ok) {
        logger.info(`Successful scrape`, { 
          url: body.url, 
          itemCount: firecrawlData?.data?.length || 0,
          userId: user.id 
        });
      } else {
        logger.warn(`Failed scrape`, { 
          url: body.url, 
          error: firecrawlData,
          userId: user.id 
        });
      }

      if (!firecrawlRes.ok) {
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

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        logger.warn(`Scrape request timeout`, { url: body.url, userId: user.id });
        return new Response(
          JSON.stringify({ error: "Request timeout" }),
          {
            status: 408,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      throw error;
    }

  } catch (err) {
    logger.error("Unexpected error in scrape-website", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: "Internal error", message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
