import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { EdgeLogger } from "../_shared/logger-utils.ts";
import { createUrlValidator } from "../_shared/url-validator.ts";
import { createErrorHandler, ErrorHandler, ErrorType } from "../_shared/error.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

interface ScrapeRequestBody {
  url: string;
  limit?: number;
  formats?: ("markdown" | "html" | "rawHtml")[];
}

serve(async (req) => {
  const errorHandler = createErrorHandler("scrape-website", req, corsHeaders);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = await rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Initialize Supabase client for authentication
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw ErrorHandler.createError(ErrorType.CONFIGURATION_ERROR, "Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw ErrorHandler.authenticationRequired();
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const user = authData?.user;
    
    if (authError || !user) {
      throw ErrorHandler.createError(ErrorType.INVALID_AUTHENTICATION);
    }

    if (req.method !== "POST") {
      throw ErrorHandler.createError(ErrorType.INVALID_INPUT, "Method not allowed");
    }

    const body = (await req.json()) as ScrapeRequestBody;
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");

    if (!apiKey) {
      throw ErrorHandler.createError(ErrorType.CONFIGURATION_ERROR, "Firecrawl API key not configured");
    }

    if (!body?.url || typeof body.url !== "string") {
      throw ErrorHandler.createError(ErrorType.MISSING_REQUIRED_FIELDS, "Valid 'url' is required");
    }

    // Enhanced URL validation with security checks
    const urlValidator = createUrlValidator(new EdgeLogger("scrape-website", req), {
      allowedDomains: [],
      maxContentLength: 25 * 1024 * 1024,
      timeout: 20000,
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

      throw ErrorHandler.createError(ErrorType.SECURITY_VIOLATION, "URL validation failed", {
        userId: user.id,
        functionName: "scrape-website",
        clientInfo: {
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent
        },
        additionalContext: { urlError: urlValidation.error }
      });
    }

    // Additional pre-flight check
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

      throw ErrorHandler.createError(ErrorType.EXTERNAL_SERVICE_ERROR, "URL accessibility check failed");
    }

    const limit =
      typeof body.limit === "number"
        ? Math.min(Math.max(body.limit, 1), 100)
        : 25;
    const formats =
      Array.isArray(body.formats) && body.formats.length > 0
        ? body.formats
        : ["markdown", "html"];

    // Call Firecrawl API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
            onlyMainContent: true,
            includeHtml: false,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const firecrawlData = await firecrawlRes.json().catch(() => ({}));

      if (!firecrawlRes.ok) {
        throw ErrorHandler.createError(ErrorType.EXTERNAL_SERVICE_ERROR, "Failed to crawl site");
      }

      return new Response(
        JSON.stringify({ success: true, data: firecrawlData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw ErrorHandler.createError(ErrorType.EXTERNAL_SERVICE_TIMEOUT, "Scrape request timed out");
      }
      throw fetchError;
    }

  } catch (error) {
    return errorHandler.handleError(error, {
      functionName: "scrape-website",
      clientInfo: {
        ip: req.headers.get("cf-connecting-ip") || 
            req.headers.get("x-forwarded-for") || 
            req.headers.get("x-real-ip") || "unknown",
        userAgent: req.headers.get("user-agent")
      }
    });
  }
});
