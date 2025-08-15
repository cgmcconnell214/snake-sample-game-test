import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface AuthContext {
  user: any;
  profile: any;
}

export interface AuthorizeOptions {
  requiredRole?: "admin" | "premium" | "basic";
  requiredTier?: "free" | "standard" | "enterprise";
}

/**
 * Validates user authentication and authorization
 * Returns 403 for unauthorized users even if client bypasses front-end guard
 */
export async function authorizeUser(
  supabaseClient: any,
  authHeader: string | null,
  options: AuthorizeOptions = {}
): Promise<AuthContext> {
  if (!authHeader) {
    throw new AuthorizationError("AUTHENTICATION_REQUIRED", "Missing authorization header");
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
  
  if (userError || !userData.user) {
    throw new AuthorizationError("INVALID_AUTHENTICATION", "Invalid or expired token");
  }

  const user = userData.user;

  // Get user profile with role and subscription tier
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("role, subscription_tier, two_factor_enabled")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    throw new AuthorizationError("PROFILE_NOT_FOUND", "User profile not found");
  }

  // Check role requirements
  if (options.requiredRole && profile?.role) {
    const roleHierarchy = { basic: 0, premium: 1, admin: 2 };
    const userRoleLevel = roleHierarchy[profile.role as keyof typeof roleHierarchy] ?? 0;
    const requiredRoleLevel = roleHierarchy[options.requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      throw new AuthorizationError(
        "INSUFFICIENT_ROLE", 
        `Requires ${options.requiredRole} role, user has ${profile.role || 'none'}`
      );
    }
  }

  // Check subscription tier requirements  
  if (options.requiredTier && profile?.subscription_tier) {
    const tierHierarchy = { free: 0, standard: 1, enterprise: 2 };
    const userTierLevel = tierHierarchy[profile.subscription_tier as keyof typeof tierHierarchy] ?? 0;
    const requiredTierLevel = tierHierarchy[options.requiredTier];

    if (userTierLevel < requiredTierLevel) {
      throw new AuthorizationError(
        "INSUFFICIENT_TIER",
        `Requires ${options.requiredTier} subscription, user has ${profile.subscription_tier || 'none'}`
      );
    }
  }

  return { user, profile };
}

export class AuthorizationError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Creates standardized 403 responses for authorization failures
 */
export function createAuthorizationErrorResponse(
  error: AuthorizationError,
  corsHeaders: Record<string, string>
): Response {
  const statusCode = error.code === "AUTHENTICATION_REQUIRED" ? 401 : 403;
  
  return new Response(
    JSON.stringify({
      error: error.message,
      code: error.code,
      success: false,
      statusCode
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    }
  );
}