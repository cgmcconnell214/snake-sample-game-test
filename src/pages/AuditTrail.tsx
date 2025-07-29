import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, Download, Filter, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AuditDetailModal from '@/components/AuditDetailModal';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
 codex/replace-any-with-correct-typescript-types

 codex/replace-instances-of-any-with-correct-types
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


 main
 main
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Mock audit trail data
  const auditLogs = [
    {
      id: 1,
      timestamp: '2024-01-20T10:30:00Z',
      action: 'Token Creation',
      user: 'john.doe@example.com',
      details: 'Created XRPL-GOLD token with 1000 total supply',
      type: 'tokenization',
      status: 'success',
      ipAddress: '192.168.1.100',
    },
    {
      id: 2,
      timestamp: '2024-01-20T09:15:00Z',
      action: 'Trade Execution',
      user: 'jane.smith@example.com',
      details: 'Executed trade: 50 XRPL-USD for 2.1 XRPL-GOLD',
      type: 'trading',
      status: 'success',
      ipAddress: '192.168.1.101',
    },
    {
      id: 3,
      timestamp: '2024-01-20T08:45:00Z',
      action: 'Login Attempt',
      user: 'admin@example.com',
      details: 'Successful login with 2FA',
      type: 'authentication',
      status: 'success',
      ipAddress: '192.168.1.102',
    },
    {
      id: 4,
      timestamp: '2024-01-19T16:22:00Z',
      action: 'Failed Login',
      user: 'unknown@example.com',
      details: 'Failed login attempt - invalid credentials',
      type: 'authentication',
      status: 'failed',
      ipAddress: '10.0.0.50',
    },
    {
      id: 5,
      timestamp: '2024-01-19T14:10:00Z',
      action: 'KYC Verification',
      user: 'new.user@example.com',
      details: 'KYC documents submitted for verification',
      type: 'compliance',
      status: 'pending',
      ipAddress: '192.168.1.103',
    },
    {
      id: 6,
      timestamp: '2024-01-19T11:30:00Z',
      action: 'Settings Update',
      user: 'admin@example.com',
      details: 'Updated security settings - enabled IP whitelist',
      type: 'configuration',
      status: 'success',
      ipAddress: '192.168.1.102',
    },
  ];

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Audit trail export has been initiated.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'failed': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tokenization': return 'bg-primary/10 text-primary border-primary/20';
      case 'trading': return 'bg-success/10 text-success border-success/20';
      case 'authentication': return 'bg-accent/10 text-accent border-accent/20';
      case 'compliance': return 'bg-warning/10 text-warning border-warning/20';
      case 'configuration': return 'bg-muted/10 text-muted-foreground border-muted/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || log.type === filterType;
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
              <div key={log.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50">
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
                    <span>Time: {new Date(log.timestamp).toLocaleString()}</span>
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
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter(log => 
                new Date(log.timestamp).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Events today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {auditLogs.filter(log => log.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(auditLogs.map(log => log.user)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Active users
            </p>
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