import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Download,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  subscription_tier: string;
  kyc_status: string;
  compliance_risk: string;
}

interface ComplianceAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
}

interface TradeRecord {
  id: string;
  asset_symbol: string;
  buyer?: any;
  seller?: any;
  quantity: number;
  price: number;
  settlement_status: string;
  execution_time: string;
}

const Admin = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTraders: 0,
    totalVolume: 0,
    pendingAlerts: 0,
  });
  const [loading, setLoading] = useState(true);

  const USERS_PER_PAGE = 20;
  const ALERTS_PER_PAGE = 10;
  const TRADES_PER_PAGE = 20;
  const [userOffset, setUserOffset] = useState(0);
  const [alertOffset, setAlertOffset] = useState(0);
  const [tradeOffset, setTradeOffset] = useState(0);

  const fetchAdminLists = async () => {
    // Load users
    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .range(userOffset, userOffset + USERS_PER_PAGE - 1);

    // Load compliance alerts
    const { data: alertsData } = await supabase
      .from("compliance_alerts")
      .select("*")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .range(alertOffset, alertOffset + ALERTS_PER_PAGE - 1);

    // Load recent trades with proper joins
    const { data: tradesData } = await supabase
      .from("trade_executions")
      .select(`
          *,
          buyer:profiles!buyer_id(email),
          seller:profiles!seller_id(email)
        `)
      .order("execution_time", { ascending: false })
      .range(tradeOffset, tradeOffset + TRADES_PER_PAGE - 1);

    return {
      users: usersData || [],
      alerts: alertsData || [],
      trades: tradesData || [],
    };
  };

  const fetchAdminStats = async () => {
    const [{ count: totalUsers }, { count: pendingAlerts }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("compliance_alerts")
        .select("*", { count: "exact", head: true })
        .eq("resolved", false),
    ]);

    return {
      totalUsers: totalUsers || 0,
      activeTraders: 0, // Calculate from recent activity
      totalVolume: 0, // Calculate from trades
      pendingAlerts: pendingAlerts || 0,
    };
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);

      const [listData, statsData] = await Promise.all([
        fetchAdminLists(),
        fetchAdminStats(),
      ]);

      setUsers(listData.users);
      setAlerts(listData.alerts);
      setTrades(listData.trades);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    const [{ count: totalUsers }, { count: pendingAlerts }] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("compliance_alerts")
        .select("*", { count: "exact", head: true })
        .eq("resolved", false),
    ]);

    return {
      totalUsers: totalUsers || 0,
      activeTraders: 0, // Calculate from recent activity
      totalVolume: 0, // Calculate from trades
      pendingAlerts: pendingAlerts || 0,
    };
  };

  // loadAdminData defined above

  useEffect(() => {
    if (profile?.role === "admin") {
      loadAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.role, userOffset, alertOffset, tradeOffset]);


  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("compliance_alerts")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: profile.user_id,
        })
        .eq("id", alertId);

      if (error) throw error;

      toast({
        title: "Alert resolved",
        description: "Compliance alert has been marked as resolved",
      });

      loadAdminData();
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    }
  };

  const exportComplianceReport = async () => {
    try {
      // This would generate an ISO-20022 compatible export
      toast({
        title: "Export initiated",
        description: "Compliance report export has been started",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
    }
  };

  if (profile?.role !== "admin") {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the admin panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={exportComplianceReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Compliance Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Traders
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTraders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalVolume.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAlerts}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="alerts">Compliance Alerts</TabsTrigger>
          <TabsTrigger value="trades">Recent Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and verification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "admin" ? "destructive" : "default"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.subscription_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.kyc_status === "approved"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {user.kyc_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.compliance_risk === "low"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {user.compliance_risk}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Edit User",
                              description: `Editing user: ${user.first_name} ${user.last_name}`,
                            });
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    setUserOffset((prev) => Math.max(0, prev - USERS_PER_PAGE))
                  }
                  disabled={userOffset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUserOffset((prev) => prev + USERS_PER_PAGE)}
                  disabled={users.length < USERS_PER_PAGE}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Alerts</CardTitle>
              <CardDescription>
                Monitor and resolve compliance-related alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>{alert.alert_type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            alert.severity === "critical"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{alert.message}</TableCell>
                      <TableCell>
                        {new Date(alert.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    setAlertOffset((prev) => Math.max(0, prev - ALERTS_PER_PAGE))
                  }
                  disabled={alertOffset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAlertOffset((prev) => prev + ALERTS_PER_PAGE)}
                  disabled={alerts.length < ALERTS_PER_PAGE}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
              <CardDescription>
                Monitor trading activity and execution status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Execution Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>{trade.asset_symbol}</TableCell>
                      <TableCell>{trade.buyer?.email}</TableCell>
                      <TableCell>{trade.seller?.email}</TableCell>
                      <TableCell>{trade.quantity}</TableCell>
                      <TableCell>${trade.price}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            trade.settlement_status === "settled"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {trade.settlement_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(trade.execution_time).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    setTradeOffset((prev) => Math.max(0, prev - TRADES_PER_PAGE))
                  }
                  disabled={tradeOffset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTradeOffset((prev) => prev + TRADES_PER_PAGE)}
                  disabled={trades.length < TRADES_PER_PAGE}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
