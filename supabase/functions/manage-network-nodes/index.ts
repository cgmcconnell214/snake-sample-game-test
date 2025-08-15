import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorizeUser, AuthorizationError, createAuthorizationErrorResponse } from "../_shared/authorization.ts";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface NetworkNode {
  id?: string;
  name: string;
  url: string;
  description?: string;
  is_active?: boolean;
  allowed_domains: string[];
  node_type?: string;
  priority?: number;
  timeout_ms?: number;
}

// Allowlist of valid domains for network nodes
const ALLOWED_DOMAINS = [
  'xrpl.ws',
  'ripple.com',
  's1.ripple.com',
  's2.ripple.com',
  'xrplcluster.com',
  'xrpl-ws.org'
];

// Internal/private network patterns to reject
const INTERNAL_NETWORK_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^fc00:/i,
  /^fe80:/i,
  /^::1$/,
  /localhost/i
];

function validateNodeUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Check protocol
    if (!['https:', 'wss:'].includes(parsedUrl.protocol)) {
      return { isValid: false, error: 'Only HTTPS and WSS protocols are allowed' };
    }
    
    // Check for internal network addresses
    const hostname = parsedUrl.hostname;
    for (const pattern of INTERNAL_NETWORK_PATTERNS) {
      if (pattern.test(hostname)) {
        return { isValid: false, error: 'Internal network addresses are not allowed' };
      }
    }
    
    // Check domain allowlist
    const domain = hostname.toLowerCase();
    const isAllowed = ALLOWED_DOMAINS.some(allowedDomain => 
      domain === allowedDomain || domain.endsWith('.' + allowedDomain)
    );
    
    if (!isAllowed) {
      return { isValid: false, error: `Domain ${domain} is not in the allowlist` };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

async function logSecurityEvent(userId: string, eventType: string, details: any) {
  await supabase.from('security_events').insert({
    user_id: userId,
    event_type: eventType,
    event_data: details,
    risk_score: eventType === 'node_validation_failure' ? 7 : 3
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authorize user with admin role requirement
    const authHeader = req.headers.get('Authorization');
    const authContext = await authorizeUser(supabase, authHeader, { 
      requiredRole: 'admin' 
    });

    const method = req.method;
    const url = new URL(req.url);
    const nodeId = url.searchParams.get('id');
    
    // Handle method override from body for client compatibility
    let requestBody: any = {};
    if (req.method === 'POST') {
      try {
        requestBody = await req.json();
        if (requestBody.method) {
          method = requestBody.method;
        }
      } catch (e) {
        // Continue with original method
      }
    }

    switch (method) {
      case 'GET':
        if (nodeId) {
          // Get specific node
          const { data, error } = await supabase
            .from('network_nodes')
            .select('*')
            .eq('id', nodeId)
            .single();

          if (error) {
            return new Response(
              JSON.stringify({ error: 'Node not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ node: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Get all nodes
          const { data, error } = await supabase
            .from('network_nodes')
            .select('*')
            .order('priority', { ascending: true });

          if (error) {
            return new Response(
              JSON.stringify({ error: 'Failed to fetch nodes' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ nodes: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'POST':
        const createData: NetworkNode = requestBody.method ? requestBody : await req.json();
        
        // Validate URL
        const createValidation = validateNodeUrl(createData.url);
        if (!createValidation.isValid) {
          await logSecurityEvent(authContext.user.id, 'node_validation_failure', {
            url: createData.url,
            error: createValidation.error,
            action: 'create'
          });
          
          return new Response(
            JSON.stringify({ error: createValidation.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: newNode, error: createError } = await supabase
          .from('network_nodes')
          .insert({
            name: createData.name,
            url: createData.url,
            description: createData.description,
            is_active: createData.is_active ?? true,
            allowed_domains: createData.allowed_domains || [],
            node_type: createData.node_type || 'validator',
            priority: createData.priority || 1,
            timeout_ms: createData.timeout_ms || 5000,
            created_by: authContext.user.id
          })
          .select()
          .single();

        if (createError) {
          return new Response(
            JSON.stringify({ error: 'Failed to create node' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await logSecurityEvent(authContext.user.id, 'node_created', {
          node_id: newNode.id,
          name: newNode.name,
          url: newNode.url
        });

        return new Response(
          JSON.stringify({ node: newNode }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'PUT':
        if (!nodeId) {
          return new Response(
            JSON.stringify({ error: 'Node ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updateData: NetworkNode = await req.json();
        
        // Validate URL if provided
        if (updateData.url) {
          const updateValidation = validateNodeUrl(updateData.url);
          if (!updateValidation.isValid) {
            await logSecurityEvent(authContext.user.id, 'node_validation_failure', {
              url: updateData.url,
              error: updateValidation.error,
              action: 'update',
              node_id: nodeId
            });
            
            return new Response(
              JSON.stringify({ error: updateValidation.error }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const { data: updatedNode, error: updateError } = await supabase
          .from('network_nodes')
          .update({
            name: updateData.name,
            url: updateData.url,
            description: updateData.description,
            is_active: updateData.is_active,
            allowed_domains: updateData.allowed_domains,
            node_type: updateData.node_type,
            priority: updateData.priority,
            timeout_ms: updateData.timeout_ms
          })
          .eq('id', nodeId)
          .select()
          .single();

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to update node' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await logSecurityEvent(authContext.user.id, 'node_updated', {
          node_id: nodeId,
          changes: updateData
        });

        return new Response(
          JSON.stringify({ node: updatedNode }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'DELETE':
        const deleteNodeId = nodeId || requestBody.nodeId;
        if (!deleteNodeId) {
          return new Response(
            JSON.stringify({ error: 'Node ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: deleteError } = await supabase
          .from('network_nodes')
          .delete()
          .eq('id', deleteNodeId);

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: 'Failed to delete node' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await logSecurityEvent(authContext.user.id, 'node_deleted', {
          node_id: deleteNodeId
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Network nodes management error:', error);
    
    if (error instanceof AuthorizationError) {
      return createAuthorizationErrorResponse(error, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});