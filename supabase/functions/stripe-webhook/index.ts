import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY is not set");
    return new Response("Stripe secret key not configured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  
  // Create service client for admin operations
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const startTime = Date.now();
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No signature", { status: 400 });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabaseService, subscription);
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(supabaseService, subscription);
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSuccess(supabaseService, invoice);
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabaseService, invoice);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    const execTime = Date.now() - startTime;
    console.log(`[STRIPE-WEBHOOK] Execution time: ${execTime}ms`);
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    const execTime = Date.now() - startTime;
    console.error("Webhook error:", error);
    console.log(`[STRIPE-WEBHOOK] Execution time: ${execTime}ms`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleSubscriptionUpdate(
  supabase: any,
  subscription: Stripe.Subscription
) {
  console.log(`Updating subscription: ${subscription.id}`);
  
  const customerId = subscription.customer as string;
  const status = subscription.status;
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  // Determine tier from price
  let tier = 'free';
  if (subscription.items.data.length > 0) {
    const price = subscription.items.data[0].price;
    const amount = price.unit_amount || 0;
    
    if (amount === 3900) { // $39.00
      tier = 'standard';
    } else if (amount === 399900) { // $3,999.00
      tier = 'enterprise';
    }
  }

  // Find user by stripe customer ID
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('subscription_tier', tier)
    .limit(1);

  if (!profiles || profiles.length === 0) {
    console.error(`No profile found for customer ID: ${customerId}`);
    return;
  }

  const userId = profiles[0].user_id;

  // Update or create subscription record
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status,
      tier,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  // Update profile tier
  await supabase
    .from('profiles')
    .update({ 
      subscription_tier: tier,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  console.log(`Updated subscription for user ${userId} to tier ${tier}`);
}

async function handleSubscriptionCancellation(
  supabase: any,
  subscription: Stripe.Subscription
) {
  console.log(`Cancelling subscription: ${subscription.id}`);
  
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!data) {
    console.error(`No subscription found for: ${subscription.id}`);
    return;
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Downgrade user to free tier
  await supabase
    .from('profiles')
    .update({ 
      subscription_tier: 'free',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', data.user_id);

  console.log(`Downgraded user ${data.user_id} to free tier`);
}

async function handlePaymentSuccess(
  supabase: any,
  invoice: Stripe.Invoice
) {
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
  
  // Log successful payment in user behavior
  if (invoice.customer) {
    await supabase
      .from('user_behavior_log')
      .insert({
        action: 'payment_success',
        metadata: {
          invoice_id: invoice.id,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
        },
        created_at: new Date().toISOString(),
      });
  }
}

async function handlePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
  console.log(`Payment failed for invoice: ${invoice.id}`);
  
  // Log failed payment and create compliance alert
  if (invoice.customer) {
    await supabase
      .from('user_behavior_log')
      .insert({
        action: 'payment_failed',
        metadata: {
          invoice_id: invoice.id,
          amount_due: invoice.amount_due,
          currency: invoice.currency,
        },
        created_at: new Date().toISOString(),
      });

    // Create compliance alert for repeated failures
    await supabase
      .from('compliance_alerts')
      .insert({
        alert_type: 'payment_failure',
        severity: 'medium',
        message: `Payment failed for invoice ${invoice.id}`,
        metadata: {
          invoice_id: invoice.id,
          customer_id: invoice.customer,
        },
        created_at: new Date().toISOString(),
      });
  }
}