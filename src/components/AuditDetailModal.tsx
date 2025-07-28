import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Copy,
  ExternalLink,
  Activity,
  Lock,
  Globe,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface AuditDetail {
  id: string;
  event_id: string;
  request_data: Record<string, unknown> | null;
  response_data: Record<string, unknown> | null;
  error_details: Record<string, unknown> | null;
  execution_time_ms: number;
  security_context: Record<string, unknown> | null;
  compliance_flags: string[];
  created_at: string;
}

interface AuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLog: AuditLog | null;
}

const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ isOpen, onClose, auditLog }) => {
  const [auditDetail, setAuditDetail] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && auditLog) {
      fetchAuditDetail();
    }
  }, [isOpen, auditLog]);

  const fetchAuditDetail = async () => {
    if (!auditLog) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_event_details')
        .select('*')
        .eq('event_id', auditLog.id.toString())
        .single();

      if (error) {
        console.error('Error fetching audit details:', error);
        return;
      }

      setAuditDetail(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getComplianceFlagColor = (flag: string) => {
    if (flag.includes('VERIFIED') || flag.includes('CLEARED') || flag.includes('OK')) {
      return 'bg-success/10 text-success border-success/20';
    }
    if (flag.includes('PENDING') || flag.includes('REVIEW')) {
      return 'bg-warning/10 text-warning border-warning/20';
    }
    if (flag.includes('FAILED') || flag.includes('VIOLATION')) {
      return 'bg-destructive/10 text-destructive border-destructive/20';
    }
    return 'bg-primary/10 text-primary border-primary/20';
  };

  if (!auditLog) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(auditLog.status)}
            Audit Event Details - {auditLog.action}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Event Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Event ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{auditLog.id}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(auditLog.id.toString())}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Action:</span>
                    <span className="text-sm font-medium">{auditLog.action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={auditLog.status === 'success' ? 'default' : 'destructive'}>
                      {auditLog.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Timestamp:</span>
                    <span className="text-sm">{new Date(auditLog.timestamp).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">User Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">User:</span>
                    <span className="text-sm">{auditLog.user}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">IP Address:</span>
                    <span className="text-sm font-mono">{auditLog.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <Badge variant="outline" className="text-xs">
                      {auditLog.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{auditLog.details}</p>
              </CardContent>
            </Card>

            {auditDetail && auditDetail.execution_time_ms && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Execution Time:</span>
                    <span className="text-sm font-medium">{auditDetail.execution_time_ms}ms</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading technical details...</div>
            ) : auditDetail ? (
              <div className="space-y-4">
                {auditDetail.request_data && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Request Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(auditDetail.request_data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                {auditDetail.response_data && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Response Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(auditDetail.response_data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                {auditDetail.error_details && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-destructive">Error Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-destructive/10 p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(auditDetail.error_details, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No detailed technical data available for this event.
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            {auditDetail?.security_context ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Security Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(auditDetail.security_context).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm font-mono">{String(value)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No security context data available for this event.
              </div>
            )}
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            {auditDetail?.compliance_flags && auditDetail.compliance_flags.length > 0 ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Compliance Flags
                  </CardTitle>
                  <CardDescription>
                    Regulatory and compliance checks applied to this event
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {auditDetail.compliance_flags.map((flag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className={getComplianceFlagColor(flag)}
                      >
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No compliance flags recorded for this event.
              </div>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Regulatory Framework
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Jurisdiction:</span>
                    <span className="text-sm">United States</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Regulatory Body:</span>
                    <span className="text-sm">SEC, CFTC, FINRA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Compliance Standard:</span>
                    <span className="text-sm">SOX, GDPR, CCPA</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" onClick={() => copyToClipboard(JSON.stringify(auditDetail, null, 2))}>
            <Copy className="h-4 w-4 mr-2" />
            Copy All Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditDetailModal;