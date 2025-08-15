import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { EdgeLogger } from "../_shared/logger-utils.ts";
import { createErrorHandler, ErrorHandler, ErrorType } from "../_shared/error.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

interface CreateOrderRequest {
  asset_id: string;
  order_type: "market" | "limit" | "stop_loss" | "take_profit";
  side: "buy" | "sell";
  quantity: number;
  price?: number; // Required for limit orders
  expires_at?: string;
}

// Validation helper for numeric fields
function validateNumericField(value: any, fieldName: string, min?: number, max?: number): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  
  if (min !== undefined && value < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }
  
  if (max !== undefined && value > max) {
    throw new Error(`${fieldName} must not exceed ${max}`);
  }
  
  return value;
}

// Validation helper for UUID fields
function validateUUID(value: any, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`${fieldName} must be a valid UUID`);
  }
  
  return value;
}

// Validation helper for enum fields
function validateEnum(value: any, fieldName: string, allowedValues: string[]): string {
  if (typeof value !== 'string' || !allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  
  return value;
}

serve(async (req) => {
  const errorHandler = createErrorHandler("create-order", req, corsHeaders);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = await rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const startTime = Date.now();
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw ErrorHandler.authenticationRequired({
        functionName: "create-order",
        requestId: crypto.randomUUID(),
        clientInfo: {
          ip: req.headers.get("cf-connecting-ip") || 
              req.headers.get("x-forwarded-for") || 
              req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent")
        }
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError) {
      throw ErrorHandler.createError(ErrorType.INVALID_AUTHENTICATION, userError.message);
    }

    const user = userData.user;
    if (!user) {
      throw ErrorHandler.createError(ErrorType.INVALID_AUTHENTICATION);
    }

    // Check subscription tier
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.subscription_tier === "free") {
      throw ErrorHandler.createError(ErrorType.SUBSCRIPTION_REQUIRED);
    }

    const requestData: CreateOrderRequest = await req.json();
    
    // Enhanced server-side validation with strict type checking
    const clientInfo = {
      ip: req.headers.get("cf-connecting-ip") || 
          req.headers.get("x-forwarded-for") || 
          req.headers.get("x-real-ip") || "unknown",
      userAgent: req.headers.get("user-agent"),
      userId: user.id
    };

    try {
      // Validate all input fields with strict type checking
      const validatedData = {
        asset_id: validateUUID(requestData.asset_id, "asset_id"),
        order_type: validateEnum(requestData.order_type, "order_type", 
          ["market", "limit", "stop_loss", "take_profit"]),
        side: validateEnum(requestData.side, "side", ["buy", "sell"]),
        quantity: validateNumericField(requestData.quantity, "quantity", 0.000001, 1000000),
        price: requestData.price ? validateNumericField(requestData.price, "price", 0.000001, 1000000) : null,
        expires_at: requestData.expires_at || null
      };

      // Additional business logic validation
      if ((validatedData.order_type === "limit" || 
           validatedData.order_type === "stop_loss" || 
           validatedData.order_type === "take_profit") && !validatedData.price) {
        throw ErrorHandler.createError(ErrorType.MISSING_REQUIRED_FIELDS, "Price required for limit/stop orders");
      }

      // Validate expires_at if provided
      if (validatedData.expires_at) {
        const expiryDate = new Date(validatedData.expires_at);
        if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
          throw ErrorHandler.createError(ErrorType.INVALID_FORMAT, "expires_at must be a valid future date");
        }
      }

      // Use secure stored procedure instead of raw SQL
      const { data: orderResult, error: orderError } = await supabaseClient
        .rpc('create_order_secure', {
          p_user_id: user.id,
          p_asset_id: validatedData.asset_id,
          p_order_type: validatedData.order_type,
          p_side: validatedData.side,
          p_quantity: validatedData.quantity,
          p_price: validatedData.price,
          p_expires_at: validatedData.expires_at
        });

      if (orderError) throw orderError;

      const orderData = orderResult[0];
      if (!orderData.success) {
        if (orderData.error_message?.includes('not found')) {
          throw ErrorHandler.notFound("Asset");
        } else if (orderData.error_message?.includes('balance')) {
          throw ErrorHandler.createError(ErrorType.INSUFFICIENT_BALANCE);
        } else {
          throw ErrorHandler.createError(ErrorType.BUSINESS_RULE_VIOLATION, orderData.error_message);
        }
      }

      const orderId = orderData.order_id;

      // Get the created order details for response
      const { data: order, error: fetchError } = await supabaseClient
        .from("orders")
        .select(`
          id,
          order_type,
          side,
          quantity,
          price,
          status,
          created_at,
          tokenized_assets (
            asset_symbol
          )
        `)
        .eq("id", orderId)
        .single();

      if (fetchError) throw fetchError;

      // Attempt to match order immediately for market orders
      if (validatedData.order_type === "market") {
        await attemptOrderMatching(supabaseClient, orderId);
      }

      // Log user behavior securely
      await supabaseClient.from("user_behavior_log").insert({
        user_id: user.id,
        action: "order_creation",
        location_data: { origin: req.headers.get("origin") },
        risk_indicators: {
          order_type: validatedData.order_type,
          order_side: validatedData.side,
          asset_symbol: order.tokenized_assets?.asset_symbol,
          quantity: validatedData.quantity,
          price: validatedData.price,
        },
      });

      const execTime = Date.now() - startTime;
      
      return new Response(
        JSON.stringify({
          success: true,
          order: {
            id: order.id,
            asset_symbol: order.tokenized_assets?.asset_symbol,
            order_type: order.order_type,
            side: order.side,
            quantity: order.quantity,
            price: order.price,
            status: order.status,
            created_at: order.created_at,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );

    } catch (validationError) {
      // Log validation failures for monitoring potential attacks
      await supabaseClient.rpc('log_validation_failure', {
        p_user_id: user.id,
        p_failure_type: 'input_validation',
        p_details: {
          error: validationError.message,
          requestData,
          endpoint: 'create-order'
        },
        p_client_info: clientInfo
      });

      throw ErrorHandler.createError(ErrorType.INVALID_INPUT, validationError.message, {
        userId: user.id,
        functionName: "create-order",
        clientInfo: {
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent
        },
        additionalContext: { endpoint: 'create-order' }
      });
    }

  } catch (error) {
    return errorHandler.handleError(error, {
      userId: user?.id,
      functionName: "create-order",
      clientInfo: {
        ip: req.headers.get("cf-connecting-ip") || 
            req.headers.get("x-forwarded-for") || 
            req.headers.get("x-real-ip") || "unknown",
        userAgent: req.headers.get("user-agent")
      }
    });
  }
});

async function attemptOrderMatching(supabaseClient: any, orderId: string) {
  // Get the order details using safe query
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .select(`
      *,
      tokenized_assets (
        asset_symbol
      )
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return;
  }

  // Find matching orders using parameterized query
  const oppositeSide = order.side === "buy" ? "sell" : "buy";
  const { data: matchingOrders, error: matchError } = await supabaseClient
    .from("orders")
    .select("*")
    .eq("asset_id", order.asset_id)
    .eq("side", oppositeSide)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (matchError || !matchingOrders || matchingOrders.length === 0) {
    return;
  }

  for (const matchOrder of matchingOrders) {
    if (order.remaining_quantity <= 0) break;

    // Check price compatibility for limit orders
    if (order.order_type === "limit" && matchOrder.order_type === "limit") {
      const priceMatch =
        order.side === "buy"
          ? order.price >= matchOrder.price
          : order.price <= matchOrder.price;

      if (!priceMatch) continue;
    }

    // Calculate execution details
    const executionQuantity = Math.min(
      order.remaining_quantity,
      matchOrder.remaining_quantity,
    );
    const executionPrice = matchOrder.price || order.price || 0;
    const totalValue = executionQuantity * executionPrice;

    // Create trade execution record using safe insert
    const { error: tradeError } = await supabaseClient
      .from("trade_executions")
      .insert({
        buyer_id: order.side === "buy" ? order.user_id : matchOrder.user_id,
        seller_id: order.side === "sell" ? order.user_id : matchOrder.user_id,
        asset_symbol: order.tokenized_assets.asset_symbol,
        quantity: executionQuantity,
        price: executionPrice,
        total_value: totalValue,
        order_id: order.id,
        settlement_status: "pending",
        compliance_flags: [],
      });

    if (tradeError) {
      continue;
    }

    // Update order quantities using secure RPC function
    const updateSuccess = await supabaseClient
      .rpc('update_order_execution', {
        p_order_id: order.id,
        p_match_order_id: matchOrder.id,
        p_execution_quantity: executionQuantity,
        p_execution_price: executionPrice
      });

    if (updateSuccess) {
      // Update local order state for next iteration
      order.remaining_quantity -= executionQuantity;
    }
  }
}
