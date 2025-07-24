import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Workflow, Zap, Clock, Target, Settings, Plus, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface WorkflowRule {
  id: string
  rule_name: string
  rule_type: string
  trigger_conditions: any
  actions: any
  is_active: boolean
  created_at: string
}

export default function WorkflowAutomation() {
  const [rules, setRules] = useState<WorkflowRule[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("rules")
  const [newRule, setNewRule] = useState({
    rule_name: "",
    rule_type: "token_distribution",
    trigger_conditions: {},
    actions: {},
    is_active: true
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    const { data, error } = await supabase
      .from('workflow_automation_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workflow rules:', error)
      // Fall back to mock data for now
      const mockRules = [
        {
          id: "1",
          rule_name: "Auto Token Distribution",
          rule_type: "token_distribution",
          trigger_conditions: { event: "purchase_complete", amount_threshold: 1000 },
          actions: { distribute_tokens: true, bonus_percentage: 5 },
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: "2", 
          rule_name: "IP Licensing Trigger",
          rule_type: "licensing",
          trigger_conditions: { asset_type: "intellectual_property", usage_detected: true },
          actions: { charge_royalty: true, notify_owner: true },
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]
      setRules(mockRules)
      return
    }

    setRules(data || [])
  }

  const handleCreateRule = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create workflow rules",
        variant: "destructive"
      })
      return
    }

    const { data, error } = await supabase
      .from('workflow_automation_rules')
      .insert({
        ...newRule,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create workflow rule",
        variant: "destructive"
      })
      return
    }

    setRules([data, ...rules])
    setIsCreateModalOpen(false)
    setNewRule({
      rule_name: "",
      rule_type: "token_distribution",
      trigger_conditions: {},
      actions: {},
      is_active: true
    })

    toast({
      title: "Success",
      description: "Workflow rule created successfully",
    })
  }

  const handleToggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    const { error } = await supabase
      .from('workflow_automation_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', ruleId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update rule status",
        variant: "destructive"
      })
      return
    }

    setRules(rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, is_active: !rule.is_active }
        : rule
    ))
    
    toast({
      title: "Rule Updated",
      description: "Workflow rule status changed",
    })
  }

  const handleConfigureRules = () => {
    setActiveTab("rules")
    setIsCreateModalOpen(true)
  }

  const handleSetTriggers = () => {
    setActiveTab("triggers")
    // Create a real IP licensing trigger rule
    setNewRule({
      rule_name: "IP Licensing Trigger",
      rule_type: "licensing",
      trigger_conditions: {
        asset_type: "intellectual_property",
        usage_detected: true,
        threshold_amount: 1.0
      },
      actions: {
        charge_royalty: true,
        royalty_percentage: 5,
        notify_owner: true,
        auto_distribute: true
      },
      is_active: true
    })
    setIsCreateModalOpen(true)
  }

  const handleSetupLogic = () => {
    setActiveTab("logic")
    // Create escrow release logic rule
    setNewRule({
      rule_name: "Escrow Release Logic",
      rule_type: "escrow",
      trigger_conditions: {
        milestone_completed: true,
        verification_required: true,
        approval_count: 2
      },
      actions: {
        release_funds: true,
        notify_beneficiaries: true,
        update_status: "released",
        create_audit_trail: true
      },
      is_active: true
    })
    setIsCreateModalOpen(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Automation</h1>
          <p className="text-muted-foreground">Automate complex business processes</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Automation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleConfigureRules}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Token Distribution Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Automated rules for token minting and distribution
            </p>
            <Button variant="outline" className="w-full">Configure Rules</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleSetTriggers}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              IP Licensing Triggers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Automatic licensing and royalty distribution
            </p>
            <Button variant="outline" className="w-full">Set Triggers</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleSetupLogic}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Escrow Release Logic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Conditional escrow release based on milestones
            </p>
            <Button variant="outline" className="w-full">Setup Logic</Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Rules Display */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Automation Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                  </div>
                  <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{rule.rule_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Triggers:</span>
                    <span className="font-medium">{Object.keys(rule.trigger_conditions).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Actions:</span>
                    <span className="font-medium">{Object.keys(rule.actions).length}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant={rule.is_active ? "destructive" : "default"} 
                    size="sm"
                    onClick={() => handleToggleRule(rule.id)}
                  >
                    {rule.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Workflow Automation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rule_name">Rule Name</Label>
                <Input
                  id="rule_name"
                  value={newRule.rule_name}
                  onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                  placeholder="e.g., Auto Distribute Tokens on Purchase"
                />
              </div>

              <div>
                <Label htmlFor="rule_type">Rule Type</Label>
                <Select value={newRule.rule_type} onValueChange={(value) => setNewRule({ ...newRule, rule_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="token_distribution">Token Distribution</SelectItem>
                    <SelectItem value="licensing">IP Licensing</SelectItem>
                    <SelectItem value="escrow">Escrow Release</SelectItem>
                    <SelectItem value="compliance">Compliance Check</SelectItem>
                    <SelectItem value="trading">Trading Automation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Trigger Conditions</Label>
                <Textarea
                  placeholder="Define when this rule should trigger (JSON format)..."
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label>Actions</Label>
                <Textarea
                  placeholder="Define what actions to take (JSON format)..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateRule} className="flex-1">
                  <Workflow className="h-4 w-4 mr-2" />
                  Create Rule
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