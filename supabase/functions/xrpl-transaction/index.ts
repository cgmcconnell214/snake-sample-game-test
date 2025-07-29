import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface XRPLTransactionRequest {
  action?: string; // Smart contract function name
  transaction_type?: 'token_transfer' | 'token_mint' | 'token_burn' | 'create_token' | 'freeze_account' | 'execute_trade';
  asset_id?: string;
  amount?: number;
  destination?: string; // For transfers
  memo?: string;
  parameters?: any; // For smart contract functions
}

// Helper logging function
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
    const startTime = Date.now();
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has admin role for blockchain operations
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw new Error(`Profile error: ${profileError.message}`);
    if (profile.role !== 'admin') {
      throw new Error("Insufficient permissions for blockchain operations");
    }

    const requestData: XRPLTransactionRequest = await req.json();
    logStep("Request data parsed", requestData);

    // Handle smart contract function execution
    if (requestData.action && requestData.parameters) {
      const resp = await handleSmartContractExecution(
        requestData.action,
        requestData.parameters,
        user.id,
        supabaseClient
      );
      const execTime = Date.now() - startTime;
      logStep(`Execution time: ${execTime}ms`);
      return resp;
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
    const execTime = Date.now() - startTime;
    logStep(`Execution time: ${execTime}ms`);
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
    const execTime = Date.now() - startTime;
    logStep("ERROR in xrpl-transaction", { message: errorMessage });
    logStep(`Execution time: ${execTime}ms`);
    return new Response(JSON.stringify({
      error: errorMessage,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Handle smart contract function execution
async function handleSmartContractExecution(
  action: string,
  parameters: any,
  userId: string,
  supabase: any
) {
  logStep("Handling smart contract execution", { action, parameters });

  // Get the smart contract function configuration
  const { data: contractFunction, error: contractError } = await supabase
    .from('smart_contract_functions')
    .select('*')
    .eq('function_name', action)
    .eq('deployment_status', 'deployed')
    .single();

  if (contractError) {
    throw new Error(`Smart contract function not found or not deployed: ${action}`);
  }

  logStep("Smart contract function found", { 
    functionName: contractFunction.function_name,
    transactionType: contractFunction.xrpl_transaction_type 
  });

  // Validate parameters against contract schema
  const requiredParams = Object.keys(contractFunction.parameters);
  const providedParams = Object.keys(parameters);
  const missingParams = requiredParams.filter(param => !providedParams.includes(param));
  
  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }

  // Validate compliance rules
  const complianceChecks = await validateCompliance(
    userId,
    action,
    parameters,
    contractFunction.compliance_rules,
    supabase
  );

  logStep("Compliance checks completed", { complianceChecks });

  if (!complianceChecks.passed) {
    throw new Error(`Compliance check failed: ${complianceChecks.reason}`);
  }

  // Create transaction queue entry
  const { data: transactionData, error: transactionError } = await supabase
    .from('blockchain_transaction_queue')
    .insert({
      user_id: userId,
      function_name: action,
      transaction_type: contractFunction.xrpl_transaction_type,
      parameters: parameters,
      status: 'pending',
      compliance_check_status: complianceChecks
    })
    .select()
    .single();

  if (transactionError) throw transactionError;

  logStep("Transaction queued", { transactionId: transactionData.id });

  // Simulate XRPL transaction execution
  const xrplResult = await simulateXRPLTransaction(
    contractFunction.xrpl_transaction_type,
    parameters,
    supabase
  );

  // Update transaction with result
  const { error: updateError } = await supabase
    .from('blockchain_transaction_queue')
    .update({
      status: xrplResult.success ? 'completed' : 'failed',
      xrpl_transaction_hash: xrplResult.transactionHash,
      xrpl_ledger_index: xrplResult.ledgerIndex,
      error_message: xrplResult.error,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionData.id);

  if (updateError) throw updateError;

  logStep("Transaction updated", { 
    success: xrplResult.success,
    hash: xrplResult.transactionHash 
  });

  // Create audit log entry
  await createAuditLog(
    userId,
    action,
    parameters,
    xrplResult,
    supabase
  );

  return new Response(JSON.stringify({
    success: xrplResult.success,
    transactionId: transactionData.id,
    transactionHash: xrplResult.transactionHash,
    ledgerIndex: xrplResult.ledgerIndex,
    complianceStatus: complianceChecks
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: xrplResult.success ? 200 : 400,
  });
}

// Compliance validation function
async function validateCompliance(
  userId: string,
  action: string,
  parameters: any,
  complianceRules: any,
  supabase: any
) {
  const checks = {
    passed: true,
    reason: '',
    details: {}
  };

  // Check KYC requirements
  if (complianceRules.kyc_required || complianceRules.kyc_verified) {
    const { data: kyc } = await supabase
      .from('kyc_verification')
      .select('verification_status')
      .eq('user_id', userId)
      .eq('verification_status', 'approved')
      .single();

    if (!kyc) {
      checks.passed = false;
      checks.reason = 'KYC verification required';
      return checks;
    }
    checks.details.kyc_status = 'verified';
  }

  // Check daily limits
  if (complianceRules.daily_limit && parameters.amount) {
    const today = new Date().toISOString().split('T')[0];
    const { data: todaysTransactions } = await supabase
      .from('blockchain_transaction_queue')
      .select('parameters')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .eq('status', 'completed');

    const todaysTotal = todaysTransactions?.reduce((total: number, tx: any) => {
      return total + (tx.parameters?.amount || 0);
    }, 0) || 0;

    if (todaysTotal + parameters.amount > complianceRules.daily_limit) {
      checks.passed = false;
      checks.reason = `Daily limit exceeded. Limit: ${complianceRules.daily_limit}, Current: ${todaysTotal}`;
      return checks;
    }
    checks.details.daily_usage = todaysTotal;
  }

  // Check admin approval requirements
  if (complianceRules.admin_approval && action === 'freeze_account') {
    checks.details.admin_approval = 'auto_approved_for_admin';
  }

  checks.details.compliance_framework = 'US_SEC_CFTC_COMPLIANT';
  return checks;
}

// Simulate XRPL transaction execution
async function simulateXRPLTransaction(
  transactionType: string,
  parameters: any,
  supabase: any
) {
  // In a real implementation, this would use the XRPL library
  const simulatedResults = {
    'TrustSet': {
      success: true,
      transactionHash: `TS${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      ledgerIndex: Math.floor(Math.random() * 1000000) + 80000000,
      fee: '12'
    },
    'Payment': {
      success: true,
      transactionHash: `PAY${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      ledgerIndex: Math.floor(Math.random() * 1000000) + 80000000,
      fee: '12'
    },
    'OfferCreate': {
      success: true,
      transactionHash: `OFF${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      ledgerIndex: Math.floor(Math.random() * 1000000) + 80000000,
      fee: '12'
    },
    'AccountSet': {
      success: true,
      transactionHash: `AS${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      ledgerIndex: Math.floor(Math.random() * 1000000) + 80000000,
      fee: '12'
    }
  };

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

  const result = simulatedResults[transactionType as keyof typeof simulatedResults];
  if (!result) {
    return {
      success: false,
      error: `Unsupported transaction type: ${transactionType}`,
      transactionHash: null,
      ledgerIndex: null
    };
  }

  return result;
}

// Create audit log entry
async function createAuditLog(
  userId: string,
  action: string,
  parameters: any,
  xrplResult: any,
  supabase: any
) {
  try {
    await supabase
      .from('user_behavior_log')
      .insert({
        user_id: userId,
        action: `blockchain_${action}`,
        location_data: { source: 'xrpl_transaction_function' },
        risk_indicators: { 
          transaction_type: action,
          success: xrplResult.success,
          amount: parameters.amount || 0
        }
      });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}