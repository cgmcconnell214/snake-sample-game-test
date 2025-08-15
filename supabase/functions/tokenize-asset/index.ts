import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateXrplCurrencyCode } from "../utils.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

const tokenizeSchema = z.object({
  asset_name: z.string().min(1, "Asset name is required"),
  asset_symbol: z
    .string()
    .regex(/^[A-Z0-9]{3,12}$/i, "Asset symbol must be 3-12 alphanumeric characters"),
  description: z.string().max(500).optional(),
  total_supply: z.number().int().positive("Total supply must be a positive integer"),
  metadata: z.record(z.any()).optional(),
});
type TokenizeRequest = z.infer<typeof tokenizeSchema>;

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[TOKENIZE-ASSET] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Global/IP rate limit (shared util)
  const rateLimitResponse = rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const startTime = Date.now();

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Subscription tier check
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.subscription_tier === "free") {
      throw new Error("Standard subscription required for tokenization");
    }

    // Validate body with Zod
    const requestJson = await req.json();
    const parsed = tokenizeSchema.safeParse(requestJson);
    if (!parsed.success) {
      const errors = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      logStep("Validation failed", { errors });
      const execTime = Date.now() - startTime;
      logStep(`Execution time: ${execTime}ms`);
      return new Response(JSON.stringify({ error: "Invalid request data", details: errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    const requestData: TokenizeRequest = parsed.data;
    logStep("Request data parsed", requestData);

    // XRPL currency code (3-char or hex for custom)
    const xrpl_currency_code = generateXrplCurrencyCode(requestData.asset_symbol);

    // Simulated XRPL interaction (stub)
    const mockXrplIssuerAddress = `r${Math.random().toString(36).substring(2, 27).toUpperCase()}`;
    const mockTransactionHash = `${Math.random().toString(16).substring(2, 66).toUpperCase()}`;
    logStep("Simulated XRPL transaction", {
      currency_code: xrpl_currency_code,
      issuer: mockXrplIssuerAddress,
      hash: mockTransactionHash,
    });

    // Create tokenized asset
    const { data: asset, error: assetError } = await supabaseClient
      .from("tokenized_assets")
      .insert({
        creator_id: user.id,
        asset_name: requestData.asset_name,
        asset_symbol: requestData.asset_symbol,
        description: requestData.description,
        total_supply: requestData.total_supply,
        circulating_supply: 0,
        xrpl_currency_code,
        xrpl_issuer_address: mockXrplIssuerAddress,
        metadata: requestData.metadata,
        compliance_data: {
          created_by: user.id,
          creation_timestamp: new Date().toISOString(),
          regulatory_status: "pending_review",
          jurisdiction: "US",
        },
        is_active: true,
      })
      .select()
      .single();

    if (assetError) throw assetError;
    logStep("Asset created in database", { assetId: asset.id });

    // Log tokenization event
    await supabaseClient.from("tokenization_events").insert({
      user_id: user.id,
      asset_symbol: requestData.asset_symbol,
      amount: requestData.total_supply,
      event_type: "token_creation",
      asset_issuer: mockXrplIssuerAddress,
      xrpl_transaction_hash: mockTransactionHash,
      xrpl_ledger_index: Math.floor(Math.random() * 1_000_000),
      compliance_metadata: {
        kyc_verified: true, // TODO: check actual KYC status
        risk_assessment: "low",
        regulatory_clearance: "pending",
      },
      iso20022_data: {
        message_type: "pain.001.001.03",
        instructing_agent: mockXrplIssuerAddress,
        creditor_account: user.id,
        remittance_information: `Token creation: ${requestData.asset_name}`,
      },
    });
    logStep("Tokenization event logged");

    // Initial holding for creator
    await supabaseClient.from("asset_holdings").insert({
      user_id: user.id,
      asset_id: asset.id,
      balance: requestData.total_supply,
      locked_balance: 0,
    });
    logStep("Initial holdings created");

    // Behavior log
    await supabaseClient.from("user_behavior_log").insert({
      user_id: user.id,
      action: "asset_tokenization",
      location_data: { origin: req.headers.get("origin") },
      risk_indicators: {
        asset_value: requestData.total_supply,
        new_asset_creation: true,
      },
    });

    const execTime = Date.now() - startTime;
    logStep(`Execution time: ${execTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        asset: {
          id: asset.id,
          asset_name: asset.asset_name,
          asset_symbol: asset.asset_symbol,
          total_supply: asset.total_supply,
          xrpl_currency_code: asset.xrpl_currency_code,
          xrpl_issuer_address: asset.xrpl_issuer_address,
          transaction_hash: mockTransactionHash,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR in tokenize-asset", { message });
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
