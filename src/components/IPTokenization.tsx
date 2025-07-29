import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Coins,
  TrendingUp,
  Lock,
  Unlock,
  DollarSign,
  FileText,
  Award,
  Calculator,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface IPAsset {
  id: string;
  name: string;
  description: string;
  ip_type: string;
  annual_revenue: number;
  valuation: number;
  total_tokens: number;
  tokens_per_dollar: number;
  annual_yield_percentage: number;
  staking_enabled: boolean;
  verification_status: string;
  is_active: boolean;
  created_at: string;
}

interface TokenHolding {
  id: string;
  ip_asset_id: string;
  tokens_held: number;
  tokens_staked: number;
  accumulated_rewards: number;
  stake_start_date: string | null;
  ip_asset: IPAsset;
}

const IPTokenization: React.FC = () => {
  const [ipAssets, setIpAssets] = useState<IPAsset[]>([]);
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [newAsset, setNewAsset] = useState({
    name: "",
    description: "",
    ip_type: "patent",
    annual_revenue: 0,
    valuation: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const fetchData = async () => {
    try {
      // Fetch IP assets
      const { data: assetsData, error: assetsError } = await supabase
        .from("ip_assets")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (assetsError) throw assetsError;
      setIpAssets(assetsData || []);

      // Fetch user's token holdings
      const { data: holdingsData, error: holdingsError } = await supabase
        .from("ip_token_holdings")
        .select(
          `
          *,
          ip_asset:ip_assets(*)
        `,
        )
        .eq("holder_id", user?.id);

      if (holdingsError) throw holdingsError;
      setTokenHoldings(holdingsData || []);
    } catch (error) {
      console.error("Error fetching IP tokenization data:", error);
      toast({
        title: "Error",
        description: "Failed to load IP tokenization data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTokenMetrics = (revenue: number, valuation: number) => {
    // Based on example: 500k/yr revenue = 1M tokens at $0.50/yr yield
    const tokensPerDollar = 2.0; // Default 2 tokens per dollar of valuation
    const totalTokens = Math.floor(valuation * tokensPerDollar);
    const annualYieldPercentage =
      revenue > 0 ? (revenue / valuation) * 0.001 : 0.005; // 0.1% of revenue to valuation ratio, min 0.5%

    return {
      totalTokens,
      tokensPerDollar,
      annualYieldPercentage: Math.max(annualYieldPercentage, 0.005), // Minimum 0.5% yield
    };
  };

  const createIPAsset = async () => {
    try {
      const metrics = calculateTokenMetrics(
        newAsset.annual_revenue,
        newAsset.valuation,
      );

      const { error } = await supabase.from("ip_assets").insert({
        creator_id: user?.id,
        name: newAsset.name,
        description: newAsset.description,
        ip_type: newAsset.ip_type,
        annual_revenue: newAsset.annual_revenue,
        valuation: newAsset.valuation,
        total_tokens: metrics.totalTokens,
        tokens_per_dollar: metrics.tokensPerDollar,
        annual_yield_percentage: metrics.annualYieldPercentage,
      });

      if (error) throw error;

      toast({
        title: "IP Asset Created",
        description: `${newAsset.name} has been tokenized successfully.`,
      });

      setNewAsset({
        name: "",
        description: "",
        ip_type: "patent",
        annual_revenue: 0,
        valuation: 0,
      });
      setShowCreateForm(false);
      fetchData();
    } catch (error) {
      console.error("Error creating IP asset:", error);
      toast({
        title: "Error",
        description: "Failed to create IP asset.",
        variant: "destructive",
      });
    }
  };

  const stakeTokens = async (assetId: string, tokensToStake: number) => {
    try {
      // In a real implementation, this would interact with smart contracts
      const { error } = await supabase.from("ip_token_holdings").upsert(
        {
          ip_asset_id: assetId,
          holder_id: user?.id,
          tokens_staked: tokensToStake,
          stake_start_date: new Date().toISOString(),
        },
        { onConflict: "ip_asset_id,holder_id" },
      );

      if (error) throw error;

      toast({
        title: "Tokens Staked",
        description: `Successfully staked ${tokensToStake} tokens.`,
      });

      fetchData();
    } catch (error) {
      console.error("Error staking tokens:", error);
      toast({
        title: "Error",
        description: "Failed to stake tokens.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  if (loading) {
    return <div className="p-6">Loading IP tokenization data...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">IP Tokenization</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tokenize IP Asset
        </Button>
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
          <TabsTrigger value="create">Create Asset</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ipAssets.map((asset) => (
              <Card
                key={asset.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <Badge
                      variant={
                        asset.verification_status === "verified"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {asset.verification_status}
                    </Badge>
                  </div>
                  <CardDescription>{asset.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">IP Type</div>
                      <div className="font-medium capitalize">
                        {asset.ip_type}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        Annual Revenue
                      </div>
                      <div className="font-medium">
                        {formatCurrency(asset.annual_revenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Valuation</div>
                      <div className="font-medium">
                        {formatCurrency(asset.valuation)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Tokens</div>
                      <div className="font-medium">
                        {formatNumber(asset.total_tokens)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">
                        {(asset.annual_yield_percentage * 100).toFixed(2)}%
                        Annual Yield
                      </span>
                    </div>
                    {asset.staking_enabled && (
                      <Badge variant="outline">
                        <Lock className="h-3 w-3 mr-1" />
                        Staking
                      </Badge>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      <Coins className="h-4 w-4 mr-1" />
                      Buy Tokens
                    </Button>
                    {asset.staking_enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stakeTokens(asset.id, 100)} // Demo: stake 100 tokens
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        Stake
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Holdings
                </CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(
                    tokenHoldings.reduce(
                      (sum, holding) => sum + holding.tokens_held,
                      0,
                    ),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Tokens owned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Staked Tokens
                </CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(
                    tokenHoldings.reduce(
                      (sum, holding) => sum + holding.tokens_staked,
                      0,
                    ),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently staked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rewards Earned
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    tokenHoldings.reduce(
                      (sum, holding) => sum + holding.accumulated_rewards,
                      0,
                    ),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Total rewards</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assets</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tokenHoldings.length}</div>
                <p className="text-xs text-muted-foreground">IP assets held</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your IP Token Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tokenHoldings.map((holding) => (
                  <div
                    key={holding.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{holding.ip_asset.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {holding.ip_asset.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span>Owned: {formatNumber(holding.tokens_held)}</span>
                        <span>
                          Staked: {formatNumber(holding.tokens_staked)}
                        </span>
                        <span>
                          Rewards: {formatCurrency(holding.accumulated_rewards)}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Calculator className="h-4 w-4 mr-1" />
                        Rewards
                      </Button>
                      {holding.tokens_staked > 0 ? (
                        <Button size="sm" variant="outline">
                          <Unlock className="h-4 w-4 mr-1" />
                          Unstake
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline">
                          <Lock className="h-4 w-4 mr-1" />
                          Stake More
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tokenize New IP Asset</CardTitle>
              <CardDescription>
                Convert your intellectual property into tradeable tokens with
                staking rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Asset Name</label>
                  <Input
                    placeholder="Enter IP asset name"
                    value={newAsset.name}
                    onChange={(e) =>
                      setNewAsset((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">IP Type</label>
                  <Select
                    value={newAsset.ip_type}
                    onValueChange={(value) =>
                      setNewAsset((prev) => ({ ...prev, ip_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patent">Patent</SelectItem>
                      <SelectItem value="trademark">Trademark</SelectItem>
                      <SelectItem value="copyright">Copyright</SelectItem>
                      <SelectItem value="trade_secret">Trade Secret</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your intellectual property asset"
                  value={newAsset.description}
                  onChange={(e) =>
                    setNewAsset((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Annual Revenue ($USD)
                  </label>
                  <Input
                    type="number"
                    placeholder="500000"
                    value={newAsset.annual_revenue || ""}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        annual_revenue: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Asset Valuation ($USD)
                  </label>
                  <Input
                    type="number"
                    placeholder="10000000"
                    value={newAsset.valuation || ""}
                    onChange={(e) =>
                      setNewAsset((prev) => ({
                        ...prev,
                        valuation: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              {newAsset.valuation > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Token Metrics Preview</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Tokens</div>
                      <div className="font-medium">
                        {formatNumber(
                          calculateTokenMetrics(
                            newAsset.annual_revenue,
                            newAsset.valuation,
                          ).totalTokens,
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Tokens per $1</div>
                      <div className="font-medium">
                        {
                          calculateTokenMetrics(
                            newAsset.annual_revenue,
                            newAsset.valuation,
                          ).tokensPerDollar
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Annual Yield</div>
                      <div className="font-medium">
                        {(
                          calculateTokenMetrics(
                            newAsset.annual_revenue,
                            newAsset.valuation,
                          ).annualYieldPercentage * 100
                        ).toFixed(2)}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={createIPAsset}
                disabled={
                  !newAsset.name ||
                  !newAsset.description ||
                  newAsset.valuation <= 0
                }
                className="w-full"
              >
                <Coins className="h-4 w-4 mr-2" />
                Create Tokenized Asset
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IPTokenization;
