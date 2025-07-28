import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Bot, Plus, Settings, Zap, DollarSign, Users, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface AIAgent {
  id: string
  name: string
  description: string
  category: string
  price_per_use: number
  total_tokens: number
  tokens_sold: number
  creator_id: string
  verification_status: string
  created_at: string
}

export default function AIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null)
  const [newAgent, setNewAgent] = useState({
    name: "",
    description: "",
    category: "workflow",
    price_per_use: 0,
    total_tokens: 1000000,
    workflow_data: {}
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch AI agents",
        variant: "destructive"
      })
      return
    }

    setAgents(data || [])
  }

  const handleCreateAgent = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create an AI agent",
        variant: "destructive"
      })
      return
    }

    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        ...newAgent,
        creator_id: user.id,
        configuration: {
          napier_integration: true,
          tokenomics_enabled: true,
          revenue_sharing: true
        }
      })
      .select()
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create AI agent",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Success",
      description: "AI agent created successfully",
    })

    setAgents([data, ...agents])
    setIsCreateModalOpen(false)
    setNewAgent({
      name: "",
      description: "",
      category: "workflow",
      price_per_use: 0,
      total_tokens: 1000000,
      workflow_data: {}
    })
  }

  const handlePurchaseAgent = async (agentId: string, tokensToPurchase: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase an AI agent",
        variant: "destructive"
      })
      return
    }

    const agent = agents.find(a => a.id === agentId)
    if (!agent) return

    const totalAmount = tokensToPurchase * agent.price_per_use

    const { error } = await supabase
      .from('ai_agent_purchases')
      .insert({
        buyer_id: user.id,
        agent_id: agentId,
        tokens_purchased: tokensToPurchase,
        total_amount: totalAmount,
        payment_status: 'completed'
      })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to purchase AI agent",
        variant: "destructive"
      })
      return
    }

    // Update agent tokens sold
    await supabase
      .from('ai_agents')
      .update({
        tokens_sold: agent.tokens_sold + tokensToPurchase
      })
      .eq('id', agentId)

    toast({
      title: "Purchase Successful",
      description: `Purchased ${tokensToPurchase} tokens for $${totalAmount}`,
    })

    fetchAgents()
  }

  const handleUpdateAgent = async (updated: Partial<AIAgent>) => {
    if (!editingAgent) return
    const { data, error } = await supabase
      .from('ai_agents')
      .update(updated)
      .eq('id', editingAgent.id)
      .select()
      .single()

    if (error) {
      toast({ title: 'Error', description: 'Failed to update agent', variant: 'destructive' })
      return
    }
    setAgents(prev => prev.map(a => (a.id === data.id ? data : a)))
    setEditingAgent(null)
    toast({ title: 'Agent Updated' })
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || agent.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents Marketplace</h1>
          <p className="text-muted-foreground">Discover and deploy tokenized AI workflow automations</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
            <SelectItem value="trading">Trading</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                </div>
                <Badge variant={agent.verification_status === 'verified' ? 'default' : 'secondary'}>
                  {agent.verification_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{agent.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per use:</span>
                  <span className="font-medium">${agent.price_per_use}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total tokens:</span>
                  <span className="font-medium">{agent.total_tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tokens sold:</span>
                  <span className="font-medium">{agent.tokens_sold.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium">
                    {(agent.total_tokens - agent.tokens_sold).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => handlePurchaseAgent(agent.id, 1000)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Buy 1000 tokens
                </Button>
                <Button variant="outline" onClick={() => setEditingAgent(agent)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state when no agents */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No AI agents found. Be the first to create one!</p>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create AI Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="e.g., Trading Bot Extreme"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  placeholder="Describe what your AI agent does..."
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newAgent.category} onValueChange={(value) => setNewAgent({ ...newAgent, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workflow">Workflow Automation</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price per Use ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newAgent.price_per_use}
                  onChange={(e) => setNewAgent({ ...newAgent, price_per_use: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="tokens">Total Tokens</Label>
                <Input
                  id="tokens"
                  type="number"
                  value={newAgent.total_tokens}
                  onChange={(e) => setNewAgent({ ...newAgent, total_tokens: parseInt(e.target.value) || 1000000 })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateAgent} className="flex-1">
                  <Zap className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editingAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit {editingAgent.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-price">Price per Use ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  defaultValue={editingAgent.price_per_use}
                  onChange={(e) => setEditingAgent({ ...editingAgent, price_per_use: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleUpdateAgent({ price_per_use: editingAgent.price_per_use })} className="flex-1">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditingAgent(null)}>
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