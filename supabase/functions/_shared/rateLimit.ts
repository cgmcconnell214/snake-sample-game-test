import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;

// Create Supabase client for rate limiting storage
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
};

export async function rateLimit(req: Request, identifier?: string): Promise<Response | null> {
  const ip = identifier ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  
  const now = Date.now();
  const windowStart = new Date(now);
  const expiresAt = new Date(now + WINDOW_MS);
  
  const supabase = getSupabaseClient();
  
  try {
    // Clean up expired entries periodically (10% chance each call)
    if (Math.random() < 0.1) {
      await supabase.rpc('cleanup_expired_rate_limits');
    }

    // Try to get existing rate limit record
    const { data: existingRecord, error: selectError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', ip)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected for new IPs
      console.error('Rate limit lookup error:', selectError);
      return null; // Allow request on error
    }

    if (!existingRecord) {
      // No existing record or expired, create new one
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          identifier: ip,
          request_count: 1,
          window_start: windowStart.toISOString(),
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('Rate limit insert error:', insertError);
        return null; // Allow request on error
      }
      
      return null; // Allow first request
    }

    // Check if we're within the rate limit
    if (existingRecord.request_count >= MAX_REQUESTS) {
      const retryAfter = Math.ceil((new Date(existingRecord.expires_at).getTime() - now) / 1000);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests",
          retryAfter: retryAfter,
          limit: MAX_REQUESTS,
          windowMs: WINDOW_MS
        }), 
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": MAX_REQUESTS.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": existingRecord.expires_at
          },
        }
      );
    }

    // Increment the request count
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ 
        request_count: existingRecord.request_count + 1 
      })
      .eq('id', existingRecord.id);

    if (updateError) {
      console.error('Rate limit update error:', updateError);
      return null; // Allow request on error
    }

    // Add rate limit headers to help clients
    const remaining = Math.max(0, MAX_REQUESTS - (existingRecord.request_count + 1));
    
    return new Response(null, {
      status: 200,
      headers: {
        "X-RateLimit-Limit": MAX_REQUESTS.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": existingRecord.expires_at
      }
    });

  } catch (error) {
    console.error('Rate limiting error:', error);
    return null; // Allow request on error to prevent blocking legitimate traffic
  }
}
