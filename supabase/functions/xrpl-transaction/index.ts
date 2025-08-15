import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Client, Wallet } from "https://esm.sh/xrpl@2.7.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { authorizeUser, AuthorizationError, createAuthorizationErrorResponse } from "../_shared/authorization.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);
const IS_TEST_ENV = Deno.env.get("DENO_ENV") === "test" || Deno.env.get("NODE_ENV") === "test";

// Strictly validated transaction request interface
interface XRPLTransactionRequest {
  transaction_type:
    | "token_transfer"
    | "token_mint"
    | "token_burn"
    | "create_token"
    | "freeze_account"
    | "execute_trade";
  asset_id: string; // Required UUID
  amount: number; // Required positive number
  destination?: string; // Required for transfers, must be valid XRPL address
  memo?: string; // Optional, max 1KB
  // Removed: action, parameters (smart contract execution handled separately)
}

// Allowed fields whitelist for validation
const ALLOWED_TRANSACTION_FIELDS = [
  'transaction_type',
  'asset_id', 
  'amount',
  'destination',
  'memo'
] as const;

// Transaction type validation
const VALID_TRANSACTION_TYPES = [
  'token_transfer',
  'token_mint', 
  'token_burn',
  'create_token',
  'freeze_account',
  'execute_trade'
] as const;

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[XRPL-TRANSACTION] ${step}${detailsStr}`);
};

// XRPL network configuration
const XRPL_NETWORKS = {
  XRPL_TESTNET: "wss://s.altnet.rippletest.net:51233",
  XAHAU_TESTNET: "wss://xahau-test.net:51233",
  BATCH_DEVNET: "wss://hooks-testnet-v3.xrpl-labs.com",
} as const;

const XRPL_BURN_ADDRESS = "rrrrrrrrrrrrrrrrrrrrrhoLvTp";

const getNetworkUrl = () => {
  const name = (Deno.env.get("XRPL_NETWORK") ||
    "XRPL_TESTNET") as keyof typeof XRPL_NETWORKS;
  return XRPL_NETWORKS[name] ?? XRPL_NETWORKS.XRPL_TESTNET;
};

const getWallet = () => {
  const seed = Deno.env.get("XRPL_WALLET_SEED");
  if (!seed) throw new Error("XRPL_WALLET_SEED not set");
  return Wallet.fromSeed(seed);
};

const submitPayment = async (
  destination: string,
  amount: string,
  currency: string,
  issuer: string,
  memo?: string,
) => {
  const client = new Client(getNetworkUrl());
  await client.connect();
  const wallet = getWallet();
  const tx: any = {
    TransactionType: "Payment",
    Account: wallet.classicAddress,
    Destination: destination,
    Amount: { currency, issuer, value: amount },
  };
  if (memo) {
    tx.Memos = [{ Memo: { MemoData: Buffer.from(memo).toString("hex") } }];
  }
  try {
    const resp = await client.submitAndWait(tx, { wallet });
    const result = resp.result;
    return {
      success: result.meta?.TransactionResult === "tesSUCCESS",
      transactionHash: result.hash,
      ledgerIndex: result.ledger_index,
      status: result.meta?.TransactionResult,
    };
  } finally {
    await client.disconnect();
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Enhanced rate limiting for blockchain operations (stricter limits)
  const rateLimitResponse = await rateLimit(req, undefined, 5); // Max 5 requests per window
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  const startTime = Date.now();
  let user: any = null;

  try {
    logStep("XRPL transaction function started");

    // Authorize user with admin role requirement for blockchain operations
    const authHeader = req.headers.get("Authorization");
    const { user: authenticatedUser, profile } = await authorizeUser(supabaseClient, authHeader, {
      requiredRole: "admin" // XRPL transactions require admin role
    });
    
    user = authenticatedUser;
    logStep("User authorized for blockchain operations", { 
      userId: user.id, 
      role: profile.role,
      email: user.email 
    });

    // Parse and validate request data with strict field filtering
    const rawRequestData = await req.json();
    const requestData = await validateAndSanitizeRequest(rawRequestData, user.id, supabaseClient);
    
    logStep("Request data validated", { 
      transaction_type: requestData.transaction_type,
      asset_id: requestData.asset_id,
      amount: requestData.amount,
      has_destination: !!requestData.destination
    });

    // Log all transaction attempts for audit trail
    await logTransactionAttempt(user.id, requestData, req, supabaseClient);

    // Reject smart contract execution - handled by separate function
    if ('action' in rawRequestData || 'parameters' in rawRequestData) {
      await logSecurityViolation(user.id, "attempted_smart_contract_execution", rawRequestData, supabaseClient);
      throw new Error("Smart contract execution not supported in this endpoint");
    }

    // Get and validate asset details
    const { data: asset, error: assetError } = await supabaseClient
      .from("tokenized_assets")
      .select("*")
      .eq("id", requestData.asset_id)
      .eq("is_active", true) // Only active assets
      .single();

    if (assetError || !asset) {
      await logSecurityViolation(user.id, "invalid_asset_access", { asset_id: requestData.asset_id }, supabaseClient);
      throw new Error("Asset not found or inactive");
    }

    // Validate asset permissions
    if (!canUserAccessAsset(user.id, asset, requestData.transaction_type)) {
      await logSecurityViolation(user.id, "unauthorized_asset_operation", {
        asset_id: requestData.asset_id,
        transaction_type: requestData.transaction_type,
        asset_creator: asset.creator_id
      }, supabaseClient);
      throw new Error("Insufficient permissions for this asset operation");
    }

    // Execute XRPL transaction with enhanced validation
    const xrplResult = await executeXRPLTransaction(requestData, asset, user.id);

    logStep("XRPL transaction executed", {
      type: requestData.transaction_type,
      asset: asset.asset_symbol,
      amount: requestData.amount,
      hash: xrplResult.transactionHash,
      status: xrplResult.status,
      isMockData: xrplResult.isMock
    });

    // Validate transaction result authenticity
    if (xrplResult.isMock && !IS_TEST_ENV) {
      await logSecurityViolation(user.id, "mock_data_in_production", xrplResult, supabaseClient);
      throw new Error("Mock transaction data not allowed in production environment");
    }

    // Update asset holdings based on transaction type
    if (
      requestData.transaction_type === "token_transfer" &&
      requestData.destination
    ) {
      // Handle transfer between users
      const { data: recipientProfile } = await supabaseClient
        .from("profiles")
        .select("user_id")
        .eq("user_id", requestData.destination)
        .single();

      if (recipientProfile) {
        // Deduct from sender
        await supabaseClient
          .from("asset_holdings")
          .update({
            balance: supabaseClient.raw(`balance - ${requestData.amount}`),
            last_updated: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("asset_id", requestData.asset_id);

        // Add to recipient
        await supabaseClient.from("asset_holdings").upsert({
          user_id: requestData.destination,
          asset_id: requestData.asset_id,
          balance: supabaseClient.raw(
            `COALESCE(balance, 0) + ${requestData.amount}`,
          ),
          last_updated: new Date().toISOString(),
        });
      }
    } else if (requestData.transaction_type === "token_mint") {
      // Mint new tokens (only for asset creator)
      if (asset.creator_id !== user.id) {
        throw new Error("Only asset creator can mint tokens");
      }

      await supabaseClient
        .from("tokenized_assets")
        .update({
          circulating_supply: supabaseClient.raw(
            `circulating_supply + ${requestData.amount}`,
          ),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestData.asset_id);

      await supabaseClient.from("asset_holdings").upsert({
        user_id: user.id,
        asset_id: requestData.asset_id,
        balance: supabaseClient.raw(
          `COALESCE(balance, 0) + ${requestData.amount}`,
        ),
        last_updated: new Date().toISOString(),
      });
    } else if (requestData.transaction_type === "token_burn") {
      // Burn tokens
      await supabaseClient
        .from("asset_holdings")
        .update({
          balance: supabaseClient.raw(`balance - ${requestData.amount}`),
          last_updated: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("asset_id", requestData.asset_id);

      await supabaseClient
        .from("tokenized_assets")
        .update({
          circulating_supply: supabaseClient.raw(
            `circulating_supply - ${requestData.amount}`,
          ),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestData.asset_id);
    }

    // Log tokenization event
    await supabaseClient.from("tokenization_events").insert({
      user_id: user.id,
      asset_symbol: asset.asset_symbol,
      amount: requestData.amount,
      event_type: requestData.transaction_type,
      asset_issuer: asset.xrpl_issuer_address,
      xrpl_transaction_hash: xrplResult.transactionHash,
      xrpl_ledger_index: xrplResult.ledgerIndex,
      transaction_status: xrplResult.status,
      compliance_metadata: {
        transaction_memo: requestData.memo,
        user_verified: true,
        timestamp: new Date().toISOString(),
      },
      iso20022_data: {
        message_type: "pacs.008.001.02", // ISO 20022 payment instruction
        instructing_agent: asset.xrpl_issuer_address,
        debtor_account: user.id,
        creditor_account: requestData.destination || user.id,
        remittance_information: `${requestData.transaction_type}: ${asset.asset_name}`,
      },
    });

    logStep("Transaction logged and processed");
    const execTime = Date.now() - startTime;
    logStep(`Execution time: ${execTime}ms`);
    return new Response(
      JSON.stringify({
        success: true,
        transaction: {
          hash: xrplResult.transactionHash,
          ledger_index: xrplResult.ledgerIndex,
          type: requestData.transaction_type,
          asset_symbol: asset.asset_symbol,
          amount: requestData.amount,
          timestamp: new Date().toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return createAuthorizationErrorResponse(error, corsHeaders);
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const execTime = Date.now() - startTime;
    
    // Log error for security monitoring
    if (user?.id) {
      await logSecurityViolation(user.id, "transaction_error", {
        error: errorMessage,
        executionTime: execTime
      }, supabaseClient).catch(console.error);
    }
    
    logStep("ERROR in xrpl-transaction", { message: errorMessage, executionTime: execTime });
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
        code: "TRANSACTION_FAILED"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

/**
 * Validate and sanitize transaction request with strict field filtering
 */
async function validateAndSanitizeRequest(
  rawData: any,
  userId: string,
  supabase: any
): Promise<XRPLTransactionRequest> {
  // Check for unauthorized fields
  const providedFields = Object.keys(rawData);
  const unauthorizedFields = providedFields.filter(field => !ALLOWED_TRANSACTION_FIELDS.includes(field as any));
  
  if (unauthorizedFields.length > 0) {
    await logSecurityViolation(userId, "unauthorized_fields", {
      unauthorizedFields,
      providedFields
    }, supabase);
    throw new Error(`Unauthorized fields: ${unauthorizedFields.join(', ')}`);
  }

  // Validate required fields
  if (!rawData.transaction_type) {
    throw new Error("transaction_type is required");
  }

  if (!rawData.asset_id) {
    throw new Error("asset_id is required");
  }

  if (typeof rawData.amount !== 'number' || rawData.amount <= 0) {
    throw new Error("amount must be a positive number");
  }

  // Validate transaction type
  if (!VALID_TRANSACTION_TYPES.includes(rawData.transaction_type)) {
    await logSecurityViolation(userId, "invalid_transaction_type", {
      provided: rawData.transaction_type,
      allowed: VALID_TRANSACTION_TYPES
    }, supabase);
    throw new Error(`Invalid transaction type: ${rawData.transaction_type}`);
  }

  // Validate UUID format for asset_id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(rawData.asset_id)) {
    throw new Error("asset_id must be a valid UUID");
  }

  // Validate destination for transfers
  if (rawData.transaction_type === 'token_transfer') {
    if (!rawData.destination) {
      throw new Error("destination is required for transfers");
    }
    
    // Basic XRPL address validation (starts with 'r' and is 25-34 chars)
    if (typeof rawData.destination !== 'string' || 
        !rawData.destination.startsWith('r') || 
        rawData.destination.length < 25 || 
        rawData.destination.length > 34) {
      throw new Error("destination must be a valid XRPL address");
    }
  }

  // Validate memo size
  if (rawData.memo && typeof rawData.memo === 'string' && rawData.memo.length > 1024) {
    throw new Error("memo cannot exceed 1024 characters");
  }

  // Validate amount limits based on transaction type
  const MAX_AMOUNTS = {
    token_transfer: 1000000,
    token_mint: 10000000,
    token_burn: 1000000,
    create_token: 100000000,
    freeze_account: 0,
    execute_trade: 1000000
  };

  if (rawData.amount > MAX_AMOUNTS[rawData.transaction_type as keyof typeof MAX_AMOUNTS]) {
    throw new Error(`Amount exceeds maximum for ${rawData.transaction_type}: ${MAX_AMOUNTS[rawData.transaction_type as keyof typeof MAX_AMOUNTS]}`);
  }

  return {
    transaction_type: rawData.transaction_type,
    asset_id: rawData.asset_id,
    amount: rawData.amount,
    destination: rawData.destination,
    memo: rawData.memo
  };
}

/**
 * Check if user can perform operation on asset
 */
function canUserAccessAsset(userId: string, asset: any, transactionType: string): boolean {
  // Asset creator can do anything
  if (asset.creator_id === userId) {
    return true;
  }

  // Non-creators can only transfer (not mint/burn)
  if (transactionType === 'token_mint' || transactionType === 'token_burn' || transactionType === 'create_token') {
    return false;
  }

  return true;
}

/**
 * Execute XRPL transaction with enhanced validation and mock detection
 */
async function executeXRPLTransaction(
  requestData: XRPLTransactionRequest,
  asset: any,
  userId: string
): Promise<any> {
  try {
    const destination = requestData.transaction_type === "token_burn"
      ? XRPL_BURN_ADDRESS
      : requestData.destination || getWallet().classicAddress;

    const result = await submitPayment(
      destination,
      String(requestData.amount),
      asset.xrpl_currency_code,
      asset.xrpl_issuer_address,
      requestData.memo,
    );

    // Mark as real transaction (not mock)
    return {
      ...result,
      isMock: false
    };
  } catch (error) {
    // In test environment, allow controlled mock data
    if (IS_TEST_ENV) {
      return {
        success: true,
        transactionHash: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ledgerIndex: Math.floor(Math.random() * 1000) + 1000000,
        status: "tesSUCCESS",
        isMock: true
      };
    }
    throw error;
  }
}

/**
 * Log transaction attempts for comprehensive audit trail
 */
async function logTransactionAttempt(
  userId: string,
  requestData: XRPLTransactionRequest,
  req: Request,
  supabase: any
): Promise<void> {
  try {
    await supabase.from("user_behavior_log").insert({
      user_id: userId,
      action: "xrpl_transaction_attempt",
      location_data: { 
        origin: req.headers.get("origin"),
        userAgent: req.headers.get("user-agent"),
        ip: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")
      },
      risk_indicators: {
        transaction_type: requestData.transaction_type,
        amount: requestData.amount,
        asset_id: requestData.asset_id,
        has_destination: !!requestData.destination,
        memo_length: requestData.memo?.length || 0
      },
    });

    // Also log to security events for high-value transactions
    if (requestData.amount > 10000) {
      await supabase.from("security_events").insert({
        user_id: userId,
        event_type: "high_value_transaction_attempt",
        event_data: {
          transaction_type: requestData.transaction_type,
          amount: requestData.amount,
          asset_id: requestData.asset_id
        },
        risk_score: requestData.amount > 100000 ? 8 : 5
      });
    }
  } catch (error) {
    console.error("Failed to log transaction attempt:", error);
  }
}

/**
 * Log security violations with detailed context
 */
async function logSecurityViolation(
  userId: string,
  violationType: string,
  details: any,
  supabase: any
): Promise<void> {
  try {
    await supabase.from("security_events").insert({
      user_id: userId,
      event_type: `xrpl_security_violation_${violationType}`,
      event_data: {
        violation_type: violationType,
        details,
        function: "xrpl-transaction",
        timestamp: new Date().toISOString()
      },
      risk_score: 9 // High risk for security violations
    });
  } catch (error) {
    console.error("Failed to log security violation:", error);
  }
}

// Create audit log entry
async function createAuditLog(
  userId: string,
  action: string,
  parameters: any,
  xrplResult: any,
  supabase: any,
) {
  try {
    await supabase.from("user_behavior_log").insert({
      user_id: userId,
      action: `blockchain_${action}`,
      location_data: { source: "xrpl_transaction_function" },
      risk_indicators: {
        transaction_type: action,
        success: xrplResult.success,
        amount: parameters.amount || 0,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
