import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Search, Download, Filter, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuditDetailModal from "@/components/AuditDetailModal";
import { supabase } from "@/integrations/supabase/client";

interface AuditLog {
  id: number;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  type: string;
  status: string;
  ipAddress: string;
}

const AuditTrail = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    const { data, error } = await supabase
      .from("audit_event_details")
      .select("id, created_at, request_data, response_data, security_context")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching audit logs:", error);
      return;
    }

    const logs: AuditLog[] = (data || []).map((e) => ({
      id: Number(e.id),
      timestamp: e.created_at,
      action: (e.request_data as any)?.action ?? "Unknown",
      user: (e.security_context as any)?.user_id ?? "Unknown",
      details: JSON.stringify((e.request_data as any)?.parameters ?? {}),
      type: (e.request_data as any)?.action ?? "unknown",
      status: (e.response_data as any)?.status ?? "unknown",
      ipAddress: (e.security_context as any)?.ip_address ?? "Unknown",
    }));

    setAuditLogs(logs);
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Audit trail export has been initiated.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default";
      case "failed":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tokenization":
        return "bg-primary/10 text-primary border-primary/20";
      case "trading":
        return "bg-success/10 text-success border-success/20";
      case "authentication":
        return "bg-accent/10 text-accent border-accent/20";
      case "compliance":
        return "bg-warning/10 text-warning border-warning/20";
      case "configuration":
        return "bg-muted/10 text-muted-foreground border-muted/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Audit Trail</h1>
        <Badge variant="outline" className="text-sm">
          <Activity className="w-4 h-4 mr-1" />
          {filteredLogs.length} Events
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Search & Filter</span>
          </CardTitle>
          <CardDescription>
            Search audit logs and apply filters to find specific events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by action, user, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tokenization">Tokenization</SelectItem>
                <SelectItem value="trading">Trading</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="configuration">Configuration</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events</CardTitle>
          <CardDescription>
            Chronological list of all system activities and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className={getTypeColor(log.type)}>
                      {log.type.toUpperCase()}
                    </Badge>
                    <h4 className="font-medium">{log.action}</h4>
                    <Badge variant={getStatusColor(log.status)}>
                      {log.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.details}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>User: {log.user}</span>
                    <span>IP: {log.ipAddress}</span>
                    <span>
                      Time: {dateTimeFormatter.format(new Date(log.timestamp))}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedAuditLog(log);
                    setIsDetailModalOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                auditLogs.filter(
                  (log) =>
                    new Date(log.timestamp).toDateString() ===
                    new Date().toDateString(),
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Events today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {auditLogs.filter((log) => log.status === "failed").length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(auditLogs.map((log) => log.user)).size}
            </div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      <AuditDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        auditLog={selectedAuditLog}
      />
    </div>
  );
};

export default AuditTrail;