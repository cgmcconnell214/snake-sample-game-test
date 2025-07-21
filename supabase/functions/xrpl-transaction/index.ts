import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface XRPLTransactionRequest {
  transaction_type: 'token_transfer' | 'token_mint' | 'token_burn';
  asset_id: string;
  amount: number;
  destination?: string; // For transfers
  memo?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[XRPL-TRANSACTION] ${step}${detailsStr}`);
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

    const requestData: XRPLTransactionRequest = await req.json();
    logStep("Request data parsed", requestData);

    // Get asset details
    const { data: asset, error: assetError } = await supabaseClient
      .from('tokenized_assets')
      .select('*')
      .eq('id', requestData.asset_id)
      .single();

    if (assetError || !asset) {
      throw new Error("Asset not found");
    }

    // Simulate XRPL transaction
    // In production, this would interact with actual XRPL network
    const mockTransactionHash = `${Math.random().toString(16).substring(2, 66).toUpperCase()}`;
    const mockLedgerIndex = Math.floor(Math.random() * 1000000);

    logStep("Simulated XRPL transaction", {
      type: requestData.transaction_type,
      asset: asset.asset_symbol,
      amount: requestData.amount,
      hash: mockTransactionHash
    });

    // Update asset holdings based on transaction type
    if (requestData.transaction_type === 'token_transfer' && requestData.destination) {
      // Handle transfer between users
      const { data: recipientProfile } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('user_id', requestData.destination)
        .single();

      if (recipientProfile) {
        // Deduct from sender
        await supabaseClient
          .from('asset_holdings')
          .update({
            balance: supabaseClient.raw(`balance - ${requestData.amount}`),
            last_updated: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('asset_id', requestData.asset_id);

        // Add to recipient
        await supabaseClient
          .from('asset_holdings')
          .upsert({
            user_id: requestData.destination,
            asset_id: requestData.asset_id,
            balance: supabaseClient.raw(`COALESCE(balance, 0) + ${requestData.amount}`),
            last_updated: new Date().toISOString(),
          });
      }
    } else if (requestData.transaction_type === 'token_mint') {
      // Mint new tokens (only for asset creator)
      if (asset.creator_id !== user.id) {
        throw new Error("Only asset creator can mint tokens");
      }

      await supabaseClient
        .from('tokenized_assets')
        .update({
          circulating_supply: supabaseClient.raw(`circulating_supply + ${requestData.amount}`),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestData.asset_id);

      await supabaseClient
        .from('asset_holdings')
        .upsert({
          user_id: user.id,
          asset_id: requestData.asset_id,
          balance: supabaseClient.raw(`COALESCE(balance, 0) + ${requestData.amount}`),
          last_updated: new Date().toISOString(),
        });
    } else if (requestData.transaction_type === 'token_burn') {
      // Burn tokens
      await supabaseClient
        .from('asset_holdings')
        .update({
          balance: supabaseClient.raw(`balance - ${requestData.amount}`),
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('asset_id', requestData.asset_id);

      await supabaseClient
        .from('tokenized_assets')
        .update({
          circulating_supply: supabaseClient.raw(`circulating_supply - ${requestData.amount}`),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestData.asset_id);
    }

    // Log tokenization event
    await supabaseClient
      .from('tokenization_events')
      .insert({
        user_id: user.id,
        asset_symbol: asset.asset_symbol,
        amount: requestData.amount,
        event_type: requestData.transaction_type,
        asset_issuer: asset.xrpl_issuer_address,
        xrpl_transaction_hash: mockTransactionHash,
        xrpl_ledger_index: mockLedgerIndex,
        compliance_metadata: {
          transaction_memo: requestData.memo,
          user_verified: true,
          timestamp: new Date().toISOString(),
        },
        iso20022_data: {
          message_type: 'pacs.008.001.02', // ISO 20022 payment instruction
          instructing_agent: asset.xrpl_issuer_address,
          debtor_account: user.id,
          creditor_account: requestData.destination || user.id,
          remittance_information: `${requestData.transaction_type}: ${asset.asset_name}`,
        },
      });

    logStep("Transaction logged and processed");

    return new Response(JSON.stringify({
      success: true,
      transaction: {
        hash: mockTransactionHash,
        ledger_index: mockLedgerIndex,
        type: requestData.transaction_type,
        asset_symbol: asset.asset_symbol,
        amount: requestData.amount,
        timestamp: new Date().toISOString(),
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in xrpl-transaction", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});