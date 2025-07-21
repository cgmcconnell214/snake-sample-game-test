import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  asset_id: string;
  order_type: 'market' | 'limit' | 'stop_loss' | 'take_profit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number; // Required for limit orders
  expires_at?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ORDER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

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

    // Check subscription tier
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.subscription_tier === 'free') {
      throw new Error("Standard subscription required for trading");
    }

    const requestData: CreateOrderRequest = await req.json();
    logStep("Request data parsed", requestData);

    // Validate order data
    if (!requestData.asset_id || !requestData.order_type || !requestData.side || !requestData.quantity) {
      throw new Error("Missing required fields");
    }

    if ((requestData.order_type === 'limit' || requestData.order_type === 'stop_loss' || requestData.order_type === 'take_profit') && !requestData.price) {
      throw new Error("Price required for limit/stop orders");
    }

    // Get asset details
    const { data: asset, error: assetError } = await supabaseClient
      .from('tokenized_assets')
      .select('*')
      .eq('id', requestData.asset_id)
      .single();

    if (assetError || !asset) {
      throw new Error("Asset not found");
    }

    // For sell orders, check user has sufficient balance
    if (requestData.side === 'sell') {
      const { data: holding } = await supabaseClient
        .from('asset_holdings')
        .select('balance, locked_balance')
        .eq('user_id', user.id)
        .eq('asset_id', requestData.asset_id)
        .single();

      const availableBalance = (holding?.balance || 0) - (holding?.locked_balance || 0);
      if (availableBalance < requestData.quantity) {
        throw new Error("Insufficient balance for sell order");
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        asset_id: requestData.asset_id,
        order_type: requestData.order_type,
        side: requestData.side,
        quantity: requestData.quantity,
        price: requestData.price,
        filled_quantity: 0,
        remaining_quantity: requestData.quantity,
        status: 'pending',
        expires_at: requestData.expires_at,
      })
      .select()
      .single();

    if (orderError) throw orderError;
    logStep("Order created", { orderId: order.id });

    // Lock assets for sell orders
    if (requestData.side === 'sell') {
      const { error: lockError } = await supabaseClient
        .from('asset_holdings')
        .update({
          locked_balance: supabaseClient.raw(`locked_balance + ${requestData.quantity}`),
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('asset_id', requestData.asset_id);

      if (lockError) {
        logStep("Failed to lock assets, rolling back order");
        await supabaseClient
          .from('orders')
          .delete()
          .eq('id', order.id);
        throw lockError;
      }
    }

    // Attempt to match order immediately for market orders
    if (requestData.order_type === 'market') {
      await attemptOrderMatching(supabaseClient, order.id);
    }

    // Log user behavior
    await supabaseClient
      .from('user_behavior_log')
      .insert({
        user_id: user.id,
        action: 'order_creation',
        location_data: { origin: req.headers.get("origin") },
        risk_indicators: {
          order_type: requestData.order_type,
          order_side: requestData.side,
          asset_symbol: asset.asset_symbol,
          quantity: requestData.quantity,
          price: requestData.price,
        },
      });

    return new Response(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        asset_symbol: asset.asset_symbol,
        order_type: order.order_type,
        side: order.side,
        quantity: order.quantity,
        price: order.price,
        status: order.status,
        created_at: order.created_at,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-order", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function attemptOrderMatching(supabaseClient: any, orderId: string) {
  logStep("Attempting order matching", { orderId });

  // Get the order details
  const { data: order } = await supabaseClient
    .from('orders')
    .select('*, tokenized_assets(asset_symbol)')
    .eq('id', orderId)
    .single();

  if (!order) return;

  // Find matching orders (opposite side, same asset)
  const oppositeSide = order.side === 'buy' ? 'sell' : 'buy';
  const { data: matchingOrders } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('asset_id', order.asset_id)
    .eq('side', oppositeSide)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (!matchingOrders || matchingOrders.length === 0) {
    logStep("No matching orders found");
    return;
  }

  for (const matchOrder of matchingOrders) {
    if (order.remaining_quantity <= 0) break;

    // Check price compatibility for limit orders
    if (order.order_type === 'limit' && matchOrder.order_type === 'limit') {
      const priceMatch = order.side === 'buy' 
        ? order.price >= matchOrder.price 
        : order.price <= matchOrder.price;
      
      if (!priceMatch) continue;
    }

    // Calculate execution details
    const executionQuantity = Math.min(order.remaining_quantity, matchOrder.remaining_quantity);
    const executionPrice = matchOrder.price || order.price || 0;
    const totalValue = executionQuantity * executionPrice;

    logStep("Executing trade", {
      buyer: order.side === 'buy' ? order.user_id : matchOrder.user_id,
      seller: order.side === 'sell' ? order.user_id : matchOrder.user_id,
      quantity: executionQuantity,
      price: executionPrice,
    });

    // Create trade execution record
    await supabaseClient
      .from('trade_executions')
      .insert({
        buyer_id: order.side === 'buy' ? order.user_id : matchOrder.user_id,
        seller_id: order.side === 'sell' ? order.user_id : matchOrder.user_id,
        asset_symbol: order.tokenized_assets.asset_symbol,
        quantity: executionQuantity,
        price: executionPrice,
        total_value: totalValue,
        order_id: order.id,
        settlement_status: 'pending',
        compliance_flags: [],
      });

    // Update order quantities
    await supabaseClient
      .from('orders')
      .update({
        filled_quantity: supabaseClient.raw(`filled_quantity + ${executionQuantity}`),
        remaining_quantity: supabaseClient.raw(`remaining_quantity - ${executionQuantity}`),
        status: supabaseClient.raw(`CASE WHEN remaining_quantity - ${executionQuantity} <= 0 THEN 'filled' ELSE 'partially_filled' END`),
        updated_at: new Date().toISOString(),
      })
      .in('id', [order.id, matchOrder.id]);

    logStep("Orders updated after execution");
  }
}