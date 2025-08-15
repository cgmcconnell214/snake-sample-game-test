import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { EdgeLogger } from "../_shared/logger-utils.ts";

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
  const logger = new EdgeLogger("create-order", req);
  
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
    logger.info("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError)
      throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    logger.setUser(user.id);
    logger.info("User authenticated", { userId: user.id });

    // Check subscription tier
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.subscription_tier === "free") {
      throw new Error("Standard subscription required for trading");
    }

    const requestData: CreateOrderRequest = await req.json();
    logger.info("Request data parsed", { 
      assetId: requestData.asset_id,
      orderType: requestData.order_type,
      side: requestData.side
    });

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
        throw new Error("Price required for limit/stop orders");
      }

      // Validate expires_at if provided
      if (validatedData.expires_at) {
        const expiryDate = new Date(validatedData.expires_at);
        if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
          throw new Error("expires_at must be a valid future date");
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
        logger.warn("Order creation failed", { 
          error: orderData.error_message,
          userId: user.id
        });
        throw new Error(orderData.error_message);
      }

      const orderId = orderData.order_id;
      logger.info("Order created successfully", { 
        orderId,
        userId: user.id
      });

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
        await attemptOrderMatching(supabaseClient, logger, orderId);
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
      logger.performance("create-order", execTime);
      
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

      logger.security("input_validation_failed", {
        error: validationError.message,
        userId: user.id,
        clientInfo
      });

      throw validationError;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const execTime = Date.now() - startTime;
    
    logger.error("ERROR in create-order", error instanceof Error ? error : new Error(errorMessage));
    logger.performance("create-order", execTime);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function attemptOrderMatching(supabaseClient: any, logger: EdgeLogger, orderId: string) {
  logger.info("Attempting order matching", { orderId });

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
    logger.warn("Order not found for matching", { orderId, error: orderError });
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

  if (matchError) {
    logger.error("Error fetching matching orders", matchError);
    return;
  }

  if (!matchingOrders || matchingOrders.length === 0) {
    logger.info("No matching orders found");
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

    logger.info("Executing trade", {
      buyer: order.side === "buy" ? order.user_id : matchOrder.user_id,
      seller: order.side === "sell" ? order.user_id : matchOrder.user_id,
      quantity: executionQuantity,
      price: executionPrice,
    });

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
      logger.error("Failed to create trade execution", tradeError);
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
      logger.info("Orders updated after execution");
      // Update local order state for next iteration
      order.remaining_quantity -= executionQuantity;
    } else {
      logger.error("Failed to update orders after execution");
    }
  }
}
