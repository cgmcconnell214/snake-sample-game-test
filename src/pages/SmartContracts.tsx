import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileCheck, Plus, Code, Handshake, Settings, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import type { Json } from "@/integrations/supabase/types"

interface SmartContractFunction {
  id: string
  function_name: string
  contract_type: string
  parameters: Json
  compliance_rules: Json | null
  deployment_status: string
  version: string
  created_at: string
}

export default function SmartContracts() {
  const [contracts, setContracts] = useState<SmartContractFunction[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newContract, setNewContract] = useState({
    function_name: "",
    contract_type: "trade",
    parameters: {},
    compliance_rules: {},
    version: "1.0.0"
  })
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    const { data, error } = await supabase
      .from('smart_contract_functions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch smart contracts",
        variant: "destructive"
      })
      return
    }

    setContracts(data || [])
  }

  const handleCreateContract = async () => {
    const { data, error } = await supabase
      .from('smart_contract_functions')
      .insert(newContract)
      .select()
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create smart contract",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Success",
      description: "Smart contract created successfully",
    })

    setContracts([data, ...contracts])
    setIsCreateModalOpen(false)
    setNewContract({
      function_name: "",
      contract_type: "trade",
      parameters: {},
      compliance_rules: {},
      version: "1.0.0"
    })
  }

  const handleDeployContract = async (contractId: string) => {
    const { error } = await supabase
      .from('smart_contract_functions')
      .update({ deployment_status: 'deployed' })
      .eq('id', contractId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to deploy contract",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Success",
      description: "Contract deployed successfully",
    })

    fetchContracts()
  }

  const contractTemplates = [
    {
      id: "trade_escrow",
      name: "Trade Escrow Contract",
      description: "Secure escrow for asset trading",
      type: "trade",
      parameters: {
        buyer_address: "string",
        seller_address: "string",
        asset_id: "string",
        amount: "number",
        escrow_period: "number"
      }
    },
    {
      id: "lending_agreement",
      name: "Lending Agreement",
      description: "Collateralized lending contract",
      type: "lending",
      parameters: {
        borrower_address: "string",
        lender_address: "string",
        collateral_asset: "string",
        loan_amount: "number",
        interest_rate: "number",
        duration: "number"
      }
    },
    {
      id: "token_distribution",
      name: "Token Distribution",
      description: "Automated token distribution rules",
      type: "distribution",
      parameters: {
        token_id: "string",
        distribution_rules: "object",
        vesting_schedule: "object",
        total_supply: "number"
      }
    }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Smart Contract Templates</h1>
          <p className="text-muted-foreground">Pre-built and custom contract templates</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Template Gallery */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Contract Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contractTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Handshake className="h-5 w-5" />
                  {template.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {template.description}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedTemplate(template.id)
                      setNewContract({
                        ...newContract,
                        function_name: template.name,
                        contract_type: template.type,
                        parameters: template.parameters
                      })
                      setIsCreateModalOpen(true)
                    }}
                  >
                    Use Template
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Deployed Contracts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Deployed Contracts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <Card key={contract.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    <CardTitle className="text-lg">{contract.function_name}</CardTitle>
                  </div>
                  <Badge variant={contract.deployment_status === 'deployed' ? 'default' : 'secondary'}>
                    {contract.deployment_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{contract.contract_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Version:</span>
                    <span className="font-medium">{contract.version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Parameters:</span>
                    <span className="font-medium">{Object.keys(contract.parameters).length}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {contract.deployment_status !== 'deployed' && (
                    <Button 
                      className="flex-1" 
                      onClick={() => handleDeployContract(contract.id)}
                    >
                      Deploy
                    </Button>
                  )}
                  <Button variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {contracts.length === 0 && (
        <div className="text-center py-12">
          <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No contracts created yet. Start with a template!</p>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Smart Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="function_name">Contract Name</Label>
                <Input
                  id="function_name"
                  value={newContract.function_name}
                  onChange={(e) => setNewContract({ ...newContract, function_name: e.target.value })}
                  placeholder="e.g., Multi-Sig Escrow Contract"
                />
              </div>

              <div>
                <Label htmlFor="contract_type">Contract Type</Label>
                <Select value={newContract.contract_type} onValueChange={(value) => setNewContract({ ...newContract, contract_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trade">Trade Contract</SelectItem>
                    <SelectItem value="lending">Lending Agreement</SelectItem>
                    <SelectItem value="distribution">Token Distribution</SelectItem>
                    <SelectItem value="governance">Governance Contract</SelectItem>
                    <SelectItem value="custom">Custom Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={newContract.version}
                  onChange={(e) => setNewContract({ ...newContract, version: e.target.value })}
                  placeholder="1.0.0"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateContract} className="flex-1">
                  <Code className="h-4 w-4 mr-2" />
                  Create Contract
                </Button>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}