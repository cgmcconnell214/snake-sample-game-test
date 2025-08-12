import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Bot,
  DollarSign,
} from "lucide-react";

interface PortfolioTestResult {
  testName: string;
  status: "pass" | "fail" | "warning";
  details: string;
  data?: any;
}

export function PortfolioIntegrationTest() {
  const [testResults, setTestResults] = useState<PortfolioTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const runPortfolioTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Test 1: Create agent that should appear in portfolio
      const testAgent = {
        name: `Portfolio Test Agent ${Date.now()}`,
        description: "Testing portfolio integration for AI agents",
        category: "trading",
        agent_type: "workflow",
        price_per_use: 0.05,
        total_tokens: 100000,
        creator_id: user.id,
        workflow_data: {
          steps: [
            {
              id: "portfolio-action",
              type: "action",
              name: "Portfolio Integration Test",
              config: { action_type: "portfolio_sync" },
            },
          ],
        },
        configuration: {
          portfolio_enabled: true,
          revenue_tracking: true,
        },
      };

      const { data: createdAgent, error: createError } = await supabase
        .from("ai_agents")
        .insert(testAgent)
        .select()
        .single();

      if (createError) {
        setTestResults((prev) => [
          ...prev,
          {
            testName: "Agent Creation for Portfolio",
            status: "fail",
            details: `Failed to create agent: ${createError.message}`,
          },
        ]);
      } else {
        setTestResults((prev) => [
          ...prev,
          {
            testName: "Agent Creation for Portfolio",
            status: "pass",
            details: "Successfully created test agent",
            data: { agentId: createdAgent.id },
          },
        ]);

        // Test 2: Verify agent appears in user's created agents list
        const { data: userAgents, error: fetchError } = await supabase
          .from("ai_agents")
          .select("*")
          .eq("creator_id", user.id)
          .eq("is_active", true);

        const agentInList = userAgents?.some((a) => a.id === createdAgent.id);

        setTestResults((prev) => [
          ...prev,
          {
            testName: "Portfolio Visibility",
            status: agentInList ? "pass" : "fail",
            details: agentInList
              ? "Agent appears in creator portfolio"
              : "Agent NOT visible in creator portfolio",
            data: {
              foundAgents: userAgents?.length,
              targetAgent: createdAgent.id,
            },
          },
        ]);

        // Test 3: Purchase tokens to test ownership tracking
        const { data: purchase, error: purchaseError } = await supabase
          .from("ai_agent_purchases")
          .insert({
            buyer_id: user.id,
            agent_id: createdAgent.id,
            tokens_purchased: 1000,
            total_amount: 50.0,
            payment_status: "completed",
          })
          .select()
          .single();

        if (purchaseError) {
          setTestResults((prev) => [
            ...prev,
            {
              testName: "Purchase Tracking",
              status: "fail",
              details: `Purchase failed: ${purchaseError.message}`,
            },
          ]);
        } else {
          setTestResults((prev) => [
            ...prev,
            {
              testName: "Purchase Tracking",
              status: "pass",
              details: "Successfully recorded purchase",
              data: { purchaseId: purchase.id },
            },
          ]);

          // Test 4: Verify purchase appears in portfolio
          const { data: purchases, error: purchaseFetchError } = await supabase
            .from("ai_agent_purchases")
            .select("*")
            .eq("buyer_id", user.id);

          const purchaseVisible = purchases?.some(
            (p) => p.agent_id === createdAgent.id,
          );

          setTestResults((prev) => [
            ...prev,
            {
              testName: "Owned Agents Visibility",
              status: purchaseVisible ? "pass" : "fail",
              details: purchaseVisible
                ? "Purchased agent visible in portfolio"
                : "Purchased agent NOT visible in portfolio",
              data: { totalPurchases: purchases?.length },
            },
          ]);
        }

        // Test 5: Create tokenized asset for the agent
        const symbol =
          createdAgent.name
            .replace(/[^A-Z0-9]/gi, "")
            .slice(0, 6)
            .toUpperCase() || "AGNT";
        const { data: tokenized, error: tokenError } = await supabase
          .from("tokenized_assets")
          .insert({
            creator_id: user.id,
            total_supply: createdAgent.total_tokens,
            asset_symbol: symbol,
            asset_name: `${createdAgent.name} Token`,
            description: `Tokenized version of ${createdAgent.name}`,
            metadata: { agent_id: createdAgent.id, source_type: "ai_agent" },
          })
          .select()
          .single();

        if (tokenError) {
          setTestResults((prev) => [
            ...prev,
            {
              testName: "Agent Tokenization",
              status: "fail",
              details: `Tokenization failed: ${tokenError.message}`,
            },
          ]);
        } else {
          setTestResults((prev) => [
            ...prev,
            {
              testName: "Agent Tokenization",
              status: "pass",
              details: "Successfully tokenized agent",
              data: { assetId: tokenized.id },
            },
          ]);

          // Test 6: Create token holdings
          const { data: holdings, error: holdingsError } = await supabase
            .from("ip_token_holdings")
            .insert({
              holder_id: user.id,
              ip_asset_id: tokenized.id,
              tokens_held: 10000,
              tokens_staked: 5000,
            })
            .select()
            .single();

          if (holdingsError) {
            setTestResults((prev) => [
              ...prev,
              {
                testName: "Token Holdings",
                status: "fail",
                details: `Holdings creation failed: ${holdingsError.message}`,
              },
            ]);
          } else {
            setTestResults((prev) => [
              ...prev,
              {
                testName: "Token Holdings",
                status: "pass",
                details: "Successfully created token holdings",
                data: { holdingsId: holdings.id },
              },
            ]);

            // Test 7: Verify tokenized assets appear in portfolio
            const { data: userAssets, error: assetsFetchError } = await supabase
              .from("tokenized_assets")
              .select("*")
              .eq("creator_id", user.id)
              .eq("is_active", true);

            const assetVisible = userAssets?.some((a) => a.id === tokenized.id);

            setTestResults((prev) => [
              ...prev,
              {
                testName: "Tokenized Assets Portfolio",
                status: assetVisible ? "pass" : "fail",
                details: assetVisible
                  ? "Tokenized agent visible in assets portfolio"
                  : "Tokenized agent NOT visible in assets portfolio",
                data: { totalAssets: userAssets?.length },
              },
            ]);
          }
        }

        // Cleanup test data
        await supabase
          .from("ai_agents")
          .update({ is_active: false })
          .eq("id", createdAgent.id);
      }
    } catch (error) {
      console.error("Portfolio test error:", error);
      setTestResults((prev) => [
        ...prev,
        {
          testName: "General Portfolio Test",
          status: "fail",
          details: `Test failed: ${error.message}`,
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: PortfolioTestResult["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: PortfolioTestResult["status"]) => {
    switch (status) {
      case "pass":
        return "text-green-600 bg-green-50 border-green-200";
      case "fail":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Portfolio Integration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Test AI agents portfolio visibility and tokenization capabilities
          </p>
          <Button onClick={runPortfolioTests} disabled={isRunning}>
            {isRunning ? "Running..." : "Run Portfolio Tests"}
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h4 className="font-medium">{result.testName}</h4>
                      <p className="text-sm opacity-80">{result.details}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      result.status === "pass" ? "default" : "destructive"
                    }
                  >
                    {result.status}
                  </Badge>
                </div>

                {result.data && (
                  <div className="mt-3 p-2 bg-white/50 rounded text-xs">
                    <strong>Data:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {testResults.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            Click "Run Portfolio Tests" to test AI agents portfolio integration
          </div>
        )}
      </CardContent>
    </Card>
  );
}
