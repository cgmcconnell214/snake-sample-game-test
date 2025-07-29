import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  FileText,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Reports = (): JSX.Element => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock reports data
  const availableReports = [
    {
      id: 1,
      name: "Trading Volume Report",
      type: "trading",
      description: "Comprehensive trading activity and volume analysis",
      lastGenerated: "2024-01-20",
      status: "ready",
      size: "2.4 MB",
    },
    {
      id: 2,
      name: "Compliance Summary",
      type: "compliance",
      description: "KYC status, AML checks, and regulatory compliance",
      lastGenerated: "2024-01-19",
      status: "ready",
      size: "1.8 MB",
    },
    {
      id: 3,
      name: "User Activity Report",
      type: "user",
      description: "User engagement, registration, and activity metrics",
      lastGenerated: "2024-01-18",
      status: "generating",
      size: "3.1 MB",
    },
    {
      id: 4,
      name: "Tokenization Report",
      type: "tokenization",
      description: "Asset tokenization statistics and performance",
      lastGenerated: "2024-01-17",
      status: "ready",
      size: "1.5 MB",
    },
  ];

  const reportMetrics = {
    trading: {
      totalVolume: "$2,450,000",
      transactions: "1,234",
      uniqueTraders: "156",
      avgTransaction: "$1,987",
    },
    compliance: {
      kycApproved: "94%",
      amlFlags: "12",
      riskAlerts: "3",
      complianceScore: "98%",
    },
    users: {
      totalUsers: "2,845",
      activeUsers: "1,203",
      newSignups: "89",
      retentionRate: "76%",
    },
    tokenization: {
      totalAssets: "45",
      totalValue: "$12,450,000",
      newTokens: "8",
      avgTokenValue: "$276,667",
    },
  };

  const handleGenerateReport = async (reportType: string) => {
    setIsGenerating(true);

    try {
      // Generate mock report data
      const reportData = {
        reportType,
        period: selectedPeriod,
        generatedAt: new Date().toISOString(),
        data: reportMetrics,
      };

      // Call the send-report-email function
      const { data, error } = await supabase.functions.invoke(
        "send-report-email",
        {
          body: {
            recipientEmail: user?.email,
            reportName: reportType,
            reportData: reportData,
            reportType: reportType.toLowerCase().replace(/\s+/g, "_"),
          },
        },
      );

      if (error) throw error;

      toast({
        title: "Report Generated",
        description: `${reportType} has been sent to your message center.`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (reportName: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${reportName}...`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "default";
      case "generating":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "trading":
        return <TrendingUp className="h-4 w-4" />;
      case "compliance":
        return <Shield className="h-4 w-4" />;
      case "user":
        return <Users className="h-4 w-4" />;
      case "tokenization":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tokenization">Tokenization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Volume
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportMetrics.trading.totalVolume}
                </div>
                <p className="text-xs text-muted-foreground">
                  Trading volume this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  KYC Approval
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportMetrics.compliance.kycApproved}
                </div>
                <p className="text-xs text-muted-foreground">Approval rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportMetrics.users.activeUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Monthly active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Assets
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportMetrics.tokenization.totalAssets}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tokenized assets
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Available Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>
                Download or generate comprehensive reports for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-muted rounded-lg">
                        {getTypeIcon(report.type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {report.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Last generated: {report.lastGenerated}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Size: {report.size}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(report.status)}>
                        {report.status.toUpperCase()}
                      </Badge>
                      {report.status === "ready" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(report.name)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleGenerateReport(report.name)}
                        disabled={
                          isGenerating || report.status === "generating"
                        }
                      >
                        {isGenerating ? "Generating..." : "Generate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs would contain specific report details */}
        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Reports</CardTitle>
              <CardDescription>
                Detailed trading activity and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Trading Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Volume
                      </span>
                      <span className="font-medium">
                        {reportMetrics.trading.totalVolume}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Transactions
                      </span>
                      <span className="font-medium">
                        {reportMetrics.trading.transactions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Unique Traders
                      </span>
                      <span className="font-medium">
                        {reportMetrics.trading.uniqueTraders}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Avg Transaction
                      </span>
                      <span className="font-medium">
                        {reportMetrics.trading.avgTransaction}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Button
                    onClick={() =>
                      handleGenerateReport("Trading Volume Report")
                    }
                    disabled={isGenerating}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Trading Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add similar content for other tabs */}
      </Tabs>
    </div>
  );
};

export default Reports;
