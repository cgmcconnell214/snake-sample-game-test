import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    const { action, documentPaths, riskScore, verificationNotes } = await req.json();

    console.log(`KYC verification request for user ${user.id}, action: ${action}`);

    if (action === 'submit_verification') {
      // Process KYC verification submission
      const verificationData = {
        user_id: user.id,
        document_type: 'government_id',
        verification_status: 'pending',
        risk_score: riskScore || 0,
        metadata: {
          document_paths: documentPaths,
          submission_timestamp: new Date().toISOString(),
          verification_notes: verificationNotes || '',
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent'),
        }
      };

      // Insert or update KYC verification record
      const { data: verification, error: verificationError } = await supabase
        .from('kyc_verification')
        .upsert(verificationData, { onConflict: 'user_id' })
        .select()
        .single();

      if (verificationError) {
        throw verificationError;
      }

      // Update profile with KYC status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('user_id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Log security event
      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'kyc_submission',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
        event_data: {
          verification_id: verification.id,
          document_count: documentPaths?.length || 0,
          risk_score: riskScore || 0
        }
      });

      console.log(`KYC verification submitted for user ${user.id}, verification ID: ${verification.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          verification_id: verification.id,
          status: 'pending',
          message: 'KYC documents submitted successfully'
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === 'get_status') {
      // Get KYC verification status
      const { data: verification, error: verificationError } = await supabase
        .from('kyc_verification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (verificationError && verificationError.code !== 'PGRST116') {
        throw verificationError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          verification: verification || null,
          status: verification?.verification_status || 'not_started'
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Admin actions (approve/reject)
    if (action === 'approve' || action === 'reject') {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        throw new Error('Insufficient permissions');
      }

      const { user_id: targetUserId, reason } = await req.json();

      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      // Update KYC verification status
      const { error: verificationError } = await supabase
        .from('kyc_verification')
        .update({
          verification_status: newStatus,
          verification_date: new Date().toISOString(),
          metadata: {
            reviewed_by: user.id,
            review_reason: reason,
            review_timestamp: new Date().toISOString()
          }
        })
        .eq('user_id', targetUserId);

      if (verificationError) {
        throw verificationError;
      }

      // Update profile KYC status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ kyc_status: newStatus })
        .eq('user_id', targetUserId);

      if (profileError) {
        throw profileError;
      }

      // Log security event
      await supabase.from('security_events').insert({
        user_id: targetUserId,
        event_type: `kyc_${action}`,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
        event_data: {
          reviewed_by: user.id,
          reason: reason,
          status: newStatus
        }
      });

      console.log(`KYC ${action} completed for user ${targetUserId} by admin ${user.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          status: newStatus,
          message: `KYC verification ${action}d successfully`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('KYC verification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});