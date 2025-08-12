import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ComplianceAlert {
  id: number;
  type: string;
  severity: string;
  message: string;
  status: string;
  createdAt: string;
}

const Compliance = (): JSX.Element => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Mock compliance data
  const allAlerts: ComplianceAlert[] = [
    {
      id: 1,
      type: "Transaction Monitoring",
      severity: "medium",
      message: "Large transaction detected for review",
      status: "pending",
      createdAt: "2024-01-20",
    },
    {
      id: 2,
      type: "AML Screening",
      severity: "low",
      message: "Routine AML check completed",
      status: "resolved",
      createdAt: "2024-01-19",
    },
  ];

  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [alertsLoading, setAlertsLoading] = useState(false);
  const alertsPerPage = 5;

  const fetchAlerts = () => {
    setAlertsLoading(true);
    setTimeout(() => {
      let filtered = [...allAlerts];
      if (severityFilter !== "all") {
        filtered = filtered.filter((a) => a.severity === severityFilter);
      }
      if (dateFilter) {
        filtered = filtered.filter(
          (a) => new Date(a.createdAt) >= new Date(dateFilter),
        );
      }
      setTotalAlerts(filtered.length);
      const start = (currentPage - 1) * alertsPerPage;
      setAlerts(filtered.slice(start, start + alertsPerPage));
      setAlertsLoading(false);
    }, 300);
  };

  useEffect(() => {
    fetchAlerts();
  }, [currentPage, severityFilter, dateFilter]);

  const complianceReports = [
    {
      id: 1,
      name: "Monthly AML Report",
      type: "AML",
      date: "2024-01-01",
      status: "completed",
    },
    {
      id: 2,
      name: "Transaction Monitoring Report",
      type: "Transaction",
      date: "2024-01-15",
      status: "pending",
    },
  ];

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setTimeout(() => {
      toast({
        title: "Report Generated",
        description: "Compliance report has been generated successfully.",
      });
      setIsLoading(false);
    }, 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          <Shield className="w-4 h-4 mr-1" />
          Risk Level: {profile?.compliance_risk?.toUpperCase()}
        </Badge>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Low</div>
            <p className="text-xs text-muted-foreground">
              Compliance risk assessment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allAlerts.filter((alert) => alert.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.kyc_status}</div>
            <p className="text-xs text-muted-foreground">
              Identity verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2d</div>
            <p className="text-xs text-muted-foreground">Days ago</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Compliance Alerts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Active Compliance Alerts</CardTitle>
                <CardDescription>
                  Monitor and respond to compliance-related notifications
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select
                  value={severityFilter}
                  onValueChange={(value) => {
                    setSeverityFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <p className="text-sm text-center text-muted-foreground">
                  Loading alerts...
                </p>
              ) : (
                <>
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(alert.status)}
                          <div>
                            <p className="font-medium">{alert.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {alert.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created: {alert.createdAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/audit?search=${encodeURIComponent(
                                  alert.type,
                                )}&type=compliance&alertId=${alert.id}`,
                              )
                            }
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Audit Trail
                          </Button>
                          {alert.status === "pending" && (
                            <Button size="sm" variant="outline">
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination className="pt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(p - 1, 1))
                          }
                        />
                      </PaginationItem>
                      {Array.from(
                        {
                          length: Math.max(
                            1,
                            Math.ceil(totalAlerts / alertsPerPage),
                          ),
                        },
                        (_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              href="#"
                              isActive={currentPage === i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={() =>
                            setCurrentPage((p) =>
                              p < Math.ceil(totalAlerts / alertsPerPage)
                                ? p + 1
                                : p,
                            )
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Compliance Reports</CardTitle>
                <CardDescription>
                  Generate and view compliance reports
                </CardDescription>
              </div>
              <Button onClick={handleGenerateReport} disabled={isLoading}>
                <FileText className="w-4 h-4 mr-2" />
                {isLoading ? "Generating..." : "Generate Report"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {report.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Date: {report.date}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          report.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {report.status.toUpperCase()}
                      </Badge>
                      {report.status === "completed" && (
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Policies</CardTitle>
              <CardDescription>
                Review current compliance policies and procedures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Anti-Money Laundering (AML)</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comprehensive AML procedures for transaction monitoring and
                    reporting.
                  </p>
                  <Badge variant="default" className="mt-2">
                    Active
                  </Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Know Your Customer (KYC)</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Identity verification and customer due diligence procedures.
                  </p>
                  <Badge variant="default" className="mt-2">
                    Active
                  </Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Transaction Monitoring</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Real-time monitoring of transactions for suspicious
                    activity.
                  </p>
                  <Badge variant="default" className="mt-2">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Compliance;
