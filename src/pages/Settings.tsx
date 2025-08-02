import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, CreditCard, User, LogOut, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import WalletIntegration from "@/components/WalletIntegration";
import TwoFactorManager from "@/components/TwoFactorManager";

const Settings = () => {
  const { user, profile, signOut, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return "bg-gradient-to-r from-purple-500 to-indigo-500";
      case "standard":
        return "bg-gradient-to-r from-blue-500 to-cyan-500";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "premium":
        return "default";
      default:
        return "secondary";
    }
  };

  const handleCreateCheckout = async (tier: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error("No session found");
      }

      const { data, error } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: { tier },
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      );

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, "_blank");
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error("No session found");
      }

      const { data, error } = await supabase.functions.invoke(
        "customer-portal",
        {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      );

      if (error) {
        // Handle the improved error response
        if (error.needsSetup) {
          toast({
            title: "No Subscription Found",
            description:
              error.message ||
              "Please subscribe to a plan first to access the customer portal.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    setIsLoading(true);
    try {
      await checkSubscription();
      toast({
        title: "Success",
        description: "Subscription status refreshed!",
      });
    } catch (error) {
      console.error("Error refreshing subscription:", error);
      toast({
        title: "Error",
        description: "Failed to refresh subscription status.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={signOut} variant="outline">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile Information</span>
          </CardTitle>
          <CardDescription>
            Your account details and verification status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-sm">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <p className="text-sm">
                {profile?.first_name} {profile?.last_name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Role
              </label>
              <div className="mt-1">
                <Badge variant={getRoleColor(profile?.role)}>
                  {profile?.role?.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                KYC Status
              </label>
              <div className="mt-1">
                <Badge
                  variant={
                    profile?.kyc_status === "approved" ? "default" : "secondary"
                  }
                >
                  {profile?.kyc_status?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Subscription</span>
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Current Plan</h3>
              <div className="mt-2">
                <Badge
                  className={`${getTierColor(profile?.subscription_tier)} text-white`}
                >
                  {profile?.subscription_tier?.toUpperCase()} TIER
                </Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={isLoading}
              >
                Manage Billing
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefreshSubscription}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Free Tier */}
            <Card
              className={
                profile?.subscription_tier === "free"
                  ? "ring-2 ring-primary"
                  : ""
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Free</CardTitle>
                <CardDescription>View-only dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
                <p className="text-sm text-muted-foreground">per month</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>• Dashboard access</li>
                  <li>• Market data viewing</li>
                  <li>• Basic analytics</li>
                </ul>
                {profile?.subscription_tier !== "free" && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleManageBilling}
                    disabled={isLoading}
                  >
                    Manage Plan
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Standard Tier */}
            <Card
              className={
                profile?.subscription_tier === "standard"
                  ? "ring-2 ring-primary"
                  : ""
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Standard</CardTitle>
                <CardDescription>Full trading capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$39</div>
                <p className="text-sm text-muted-foreground">per month</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>• All Free features</li>
                  <li>• Trading functionality</li>
                  <li>• Advanced analytics</li>
                  <li>• API access</li>
                </ul>
                {profile?.subscription_tier !== "standard" && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleCreateCheckout("standard")}
                    disabled={isLoading}
                  >
                    {profile?.subscription_tier === "free"
                      ? "Upgrade to Standard"
                      : "Switch to Standard"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card
              className={
                profile?.subscription_tier === "enterprise"
                  ? "ring-2 ring-primary"
                  : ""
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Enterprise</CardTitle>
                <CardDescription>AI trading & compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$3,999</div>
                <p className="text-sm text-muted-foreground">per month</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>• All Standard features</li>
                  <li>• AI trading bots</li>
                  <li>• Compliance reporting</li>
                  <li>• Priority support</li>
                </ul>
                {profile?.subscription_tier !== "enterprise" && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleCreateCheckout("enterprise")}
                    disabled={isLoading}
                  >
                    {profile?.subscription_tier === "free"
                      ? "Upgrade to Enterprise"
                      : "Switch to Enterprise"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security</span>
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Badge
              variant={profile?.two_factor_enabled ? "default" : "secondary"}
            >
              {profile?.two_factor_enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Compliance Risk Level</h3>
              <p className="text-sm text-muted-foreground">
                Your current risk assessment
              </p>
            </div>
            <Badge
              variant={
                profile?.compliance_risk === "low" ? "default" : "destructive"
              }
            >
              {profile?.compliance_risk?.toUpperCase()}
            </Badge>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                // Navigate to security settings or open a security modal
                toast({
                  title: "Security Settings",
                  description: "Use the Two-Factor Authentication section below to enhance security.",
                });
              }}
            >
              Update Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <TwoFactorManager />

      {/* Wallet Integration */}
      <WalletIntegration />
    </div>
  );
};

export default Settings;
