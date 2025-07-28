import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "premium" | "basic";
  requiredTier?: "free" | "standard" | "enterprise";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredTier,
}) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check role requirements
  if (requiredRole && profile?.role) {
    const roleHierarchy = { basic: 0, premium: 1, admin: 2 };
    const userRoleLevel =
      roleHierarchy[profile.role as keyof typeof roleHierarchy] ?? 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">
              Access Denied
            </h2>
            <p className="text-muted-foreground">
              You need {requiredRole} access to view this page.
            </p>
          </div>
        </div>
      );
    }
  }

  // Check subscription tier requirements
  if (requiredTier && profile?.subscription_tier) {
    const tierHierarchy = { free: 0, standard: 1, enterprise: 2 };
    const userTierLevel =
      tierHierarchy[profile.subscription_tier as keyof typeof tierHierarchy] ??
      0;
    const requiredTierLevel = tierHierarchy[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">
              Subscription Required
            </h2>
            <p className="text-muted-foreground">
              You need a {requiredTier} subscription to access this feature.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
