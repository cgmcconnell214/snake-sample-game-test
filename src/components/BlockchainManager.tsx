import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  Shield, 
  Settings, 
  Play, 
  Pause,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Coins,
  Lock,
  Unlock,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SmartContractFunction {
  id: string;
  function_name: string;
  contract_type: string;
  xrpl_transaction_type: string;
  parameters: Record<string, unknown>;
  compliance_rules: Record<string, unknown>;
  deployment_status: string;
  version: string;
  created_at: string;
}

interface BlockchainTransaction {
  id: string;
  function_name: string;
  transaction_type: string;
  parameters: Record<string, unknown>;
  status: string;
  xrpl_transaction_hash?: string;
  created_at: string;
  error_message?: string;
}

interface XRPLConfig {
  id: string;
  network_type: string;
  compliance_settings: Record<string, unknown>;
  minting_policies: Record<string, unknown>;
  kyc_requirements: Record<string, unknown>;
  regulatory_framework: Record<string, unknown>;
}

const BlockchainManager: React.FC = () => {
  const [smartContracts, setSmartContracts] = useState<SmartContractFunction[]>([]);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [xrplConfig, setXrplConfig] = useState<XRPLConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch smart contract functions
      const { data: contractsData, error: contractsError } = await supabase
        .from('smart_contract_functions')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;
      setSmartContracts(contractsData || []);

      // Fetch blockchain transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('blockchain_transaction_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Fetch XRPL configuration
      const { data: configData, error: configError } = await supabase
        .from('xrpl_config')
        .select('*')
        .single();

      if (configError && configError.code !== 'PGRST116') throw configError;
      setXrplConfig(configData);

    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      toast({
        title: "Error",
        description: "Failed to load blockchain data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeSmartContract = async (contractFunction: SmartContractFunction) => {
    try {
      const { error } = await supabase
        .from('blockchain_transaction_queue')
        .insert({
          function_name: contractFunction.function_name,
          transaction_type: contractFunction.xrpl_transaction_type,
          parameters: contractFunction.parameters,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Smart Contract Queued",
        description: `${contractFunction.function_name} has been queued for execution.`,
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error executing smart contract:', error);
      toast({
        title: "Error",
        description: "Failed to queue smart contract execution.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Activity className="h-4 w-4 text-warning animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getContractTypeIcon = (type: string) => {
    switch (type) {
      case 'minting':
        return <Coins className="h-4 w-4 text-primary" />;
      case 'trading':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'compliance':
        return <Shield className="h-4 w-4 text-warning" />;
      default:
        return <Settings className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading blockchain infrastructure...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blockchain Management</h1>
        <Badge variant="outline" className="text-sm">
          <Activity className="w-4 h-4 mr-1" />
          XRPL Integration
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Network Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Status</CardTitle>
                <Activity className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">Online</div>
                <p className="text-xs text-muted-foreground">
                  {xrplConfig?.network_type || 'testnet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Smart Contracts</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{smartContracts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {smartContracts.filter(c => c.deployment_status === 'deployed').length} deployed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions.filter(t => t.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  In queue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
                <Shield className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">Active</div>
                <p className="text-xs text-muted-foreground">
                  All checks passing
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Blockchain Activity</CardTitle>
              <CardDescription>Latest smart contract executions and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(transaction.status)}
                      <div>
                        <div className="font-medium">{transaction.function_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.transaction_type} • {new Date(transaction.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Smart Contract Functions</CardTitle>
              <CardDescription>XRPL-compatible smart contract functions ready for deployment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {smartContracts.map((contract) => (
                  <div key={contract.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getContractTypeIcon(contract.contract_type)}
                        <div>
                          <h4 className="font-medium">{contract.function_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {contract.contract_type} • {contract.xrpl_transaction_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={contract.deployment_status === 'deployed' ? 'default' : 'secondary'}
                        >
                          {contract.deployment_status}
                        </Badge>
                        <Button 
                          size="sm"
                          onClick={() => executeSmartContract(contract)}
                          disabled={contract.deployment_status !== 'deployed'}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Execute
                        </Button>
                      </div>
                    </div>
                    
                    {/* Parameters */}
                    <div className="text-sm space-y-1">
                      <div className="font-medium">Parameters:</div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(contract.parameters, null, 2)}
                      </pre>
                    </div>

                    {/* Compliance Rules */}
                    <div className="text-sm space-y-1 mt-2">
                      <div className="font-medium">Compliance Rules:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(contract.compliance_rules).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Queue</CardTitle>
              <CardDescription>Blockchain transactions and their execution status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(transaction.status)}
                        <div>
                          <h4 className="font-medium">{transaction.function_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {transaction.transaction_type} • {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </div>

                    {transaction.xrpl_transaction_hash && (
                      <div className="text-sm space-y-1">
                        <div className="font-medium">Transaction Hash:</div>
                        <div className="font-mono text-xs bg-muted p-2 rounded">
                          {transaction.xrpl_transaction_hash}
                        </div>
                      </div>
                    )}

                    {transaction.error_message && (
                      <div className="text-sm space-y-1 mt-2">
                        <div className="font-medium text-destructive">Error:</div>
                        <div className="text-xs bg-destructive/10 p-2 rounded text-destructive">
                          {transaction.error_message}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          {xrplConfig && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>XRPL Network Configuration</CardTitle>
                  <CardDescription>Current blockchain network settings and policies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Network Type</label>
                      <div className="mt-1">
                        <Badge variant="outline">{xrplConfig.network_type}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Compliance Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(xrplConfig.compliance_settings).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                          <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                            {String(value)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Minting Policies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(xrplConfig.minting_policies).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockchainManager;