import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  FileText,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  Coins,
  TrendingUp,
  Users,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const assetTypes = [
  { value: "commodity", label: "Commodity", icon: Coins },
  { value: "real-estate", label: "Real Estate", icon: TrendingUp },
  { value: "equity", label: "Equity", icon: Users },
  { value: "debt", label: "Debt Instrument", icon: DollarSign },
  { value: "derivative", label: "Derivative", icon: TrendingUp },
];

const complianceSteps = [
  {
    id: 1,
    title: "Asset Documentation",
    status: "completed",
    description: "Upload legal documents",
  },
  {
    id: 2,
    title: "Valuation Report",
    status: "completed",
    description: "Third-party asset valuation",
  },
  {
    id: 3,
    title: "Regulatory Review",
    status: "in-progress",
    description: "ISO 20022 compliance check",
  },
  {
    id: 4,
    title: "XRPL Minting",
    status: "pending",
    description: "Token creation on XRPL",
  },
  {
    id: 5,
    title: "Market Listing",
    status: "pending",
    description: "Available for trading",
  },
];

const recentTokenizations = [
  {
    id: "TKN001",
    name: "Premium Gold Bars 1kg",
    type: "commodity",
    value: 65000,
    tokens: 1000,
    status: "active",
    progress: 100,
  },
  {
    id: "TKN002",
    name: "Manhattan Office Complex",
    type: "real-estate",
    value: 2500000,
    tokens: 10000,
    status: "pending",
    progress: 75,
  },
  {
    id: "TKN003",
    name: "Silver Futures Contract",
    type: "derivative",
    value: 85000,
    tokens: 850,
    status: "review",
    progress: 45,
  },
];

export default function Tokenize(): JSX.Element {
  const [assetType, setAssetType] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [totalSupply, setTotalSupply] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const { toast } = useToast();

  const handleSubmitTokenization = async () => {
    if (
      !assetType ||
      !tokenName ||
      !tokenSymbol ||
      !totalValue ||
      !totalSupply
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error("No session found");
      }

      const { error } = await supabase.functions.invoke("tokenize-asset", {
        body: {
          asset_name: tokenName,
          asset_symbol: tokenSymbol,
          description,
          total_supply: parseFloat(totalSupply),
          metadata: {
            asset_type: assetType,
            estimated_value: parseFloat(totalValue),
            created_via: "web_portal",
          },
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        let description =
          error.message || "Failed to tokenize asset. Please try again.";
        if ((error as any).status === 400) {
          description = error.message;
        } else if ((error as any).status === 429) {
          description =
            "Too many tokenization requests. Please wait and try again later.";
        }
        toast({
          title: "Tokenization Failed",
          description,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Tokenization Successful!",
        description: `Asset ${tokenName} has been tokenized with symbol ${tokenSymbol}`,
      });

      // Reset form
      setAssetType("");
      setTokenName("");
      setTokenSymbol("");
      setTotalValue("");
      setTotalSupply("");
      setDescription("");
    } catch (error: any) {
      console.error("Tokenization error:", error);
      toast({
        title: "Tokenization Failed",
        description:
          error.message || "Failed to tokenize asset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTokenization = async () => {
    await handleSubmitTokenization();
    setShowSummary(false);
  };

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Asset Tokenization</h1>
            <p className="text-muted-foreground">
              Convert real-world assets into tradeable XRPL tokens
            </p>
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            <Shield className="h-3 w-3 mr-1" />
            ISO 20022 Compliant
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tokenization Form */}
          <div className="lg:col-span-2">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Create New Token
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Asset Details</TabsTrigger>
                    <TabsTrigger value="documentation">
                      Documentation
                    </TabsTrigger>
                    <TabsTrigger value="parameters">
                      Token Parameters
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Asset Type</Label>
                        <Select value={assetType} onValueChange={setAssetType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset type" />
                          </SelectTrigger>
                          <SelectContent>
                            {assetTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Asset Name</Label>
                        <Input
                          placeholder="e.g., Premium Gold Bars"
                          value={tokenName}
                          onChange={(e) => setTokenName(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Total Asset Value (USD)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={totalValue}
                          onChange={(e) => setTotalValue(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div>
                        <Label>Token Supply</Label>
                        <Input
                          type="number"
                          placeholder="1000"
                          value={totalSupply}
                          onChange={(e) => setTotalSupply(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Asset Description</Label>
                      <Textarea
                        placeholder="Detailed description of the asset including specifications, location, condition, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="documentation" className="space-y-4">
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium mb-2">
                          Upload Asset Documentation
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload ownership documents, certificates, valuations,
                          and legal papers
                        </p>
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Files
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Required Documents:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            Ownership Certificate
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-warning" />
                            Valuation Report
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-warning" />
                            Insurance Documents
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-warning" />
                            Legal Opinion
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="parameters" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Token Symbol</Label>
                        <Input
                          placeholder="e.g., GOLD001"
                          value={tokenSymbol}
                          onChange={(e) =>
                            setTokenSymbol(e.target.value.toUpperCase())
                          }
                          className="font-mono uppercase"
                          maxLength={20}
                        />
                      </div>

                      <div>
                        <Label>Minimum Investment</Label>
                        <Input
                          type="number"
                          placeholder="100.00"
                          className="font-mono"
                        />
                      </div>

                      <div>
                        <Label>Trading Fee (%)</Label>
                        <Input
                          type="number"
                          placeholder="0.1"
                          step="0.01"
                          className="font-mono"
                        />
                      </div>

                      <div>
                        <Label>Lock-up Period (days)</Label>
                        <Input
                          type="number"
                          placeholder="30"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="bg-muted/20 rounded p-4">
                      <h4 className="font-medium mb-2">
                        Token Economics Preview
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Token Price:
                          </span>
                          <div className="font-mono font-medium">
                            $
                            {totalValue && totalSupply
                              ? (
                                  parseFloat(totalValue) /
                                  parseFloat(totalSupply)
                                ).toFixed(2)
                              : "0.00"}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Market Cap:
                          </span>
                          <div className="font-mono font-medium">
                            ${totalValue || "0"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setShowSummary(true)}
                      disabled={
                        !assetType ||
                        !tokenName ||
                        !tokenSymbol ||
                        !totalValue ||
                        !totalSupply ||
                        isLoading
                      }
                    >
                      Create Token on XRPL
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Progress & Recent Tokenizations */}
          <div className="space-y-6">
            {/* Compliance Progress */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Compliance Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {complianceSteps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {step.status === "completed" && (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                      {step.status === "in-progress" && (
                        <Clock className="h-5 w-5 text-warning animate-pulse" />
                      )}
                      {step.status === "pending" && (
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Tokenizations */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Recent Tokenizations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTokenizations.map((token) => (
                  <div
                    key={token.id}
                    className="space-y-3 p-3 rounded-lg bg-muted/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{token.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {token.type}
                          </Badge>
                          <Badge
                            variant={
                              token.status === "active"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {token.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-mono">
                          ${token.value.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">
                          {token.tokens} tokens
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{token.progress}%</span>
                      </div>
                      <Progress value={token.progress} className="h-1" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showSummary} onOpenChange={setShowSummary}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Asset Details</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the asset information before tokenization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asset Type</span>
              <span className="font-medium">
                {assetTypes.find((t) => t.value === assetType)?.label ||
                  assetType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token Name</span>
              <span className="font-medium">{tokenName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Symbol</span>
              <span className="font-mono font-medium">{tokenSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Value</span>
              <span className="font-mono font-medium">
                $
                {totalValue
                  ? parseFloat(totalValue).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Supply</span>
              <span className="font-mono font-medium">{totalSupply}</span>
            </div>
            {description && (
              <div>
                <span className="text-muted-foreground">Description</span>
                <p className="mt-1 max-h-32 overflow-y-auto text-muted-foreground">
                  {description}
                </p>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTokenization}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Tokenizing...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
