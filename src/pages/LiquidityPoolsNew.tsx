import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Droplets, Lock, Timer, Plus, Minus, TrendingUp, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface LiquidityPool {
  id: string
  pool_name: string
  token_a: string
  token_b: string
  token_a_balance: number
  token_b_balance: number
  total_liquidity: number
  apy: number
  pool_type: string
  lock_period?: number
  is_active: boolean
}

export default function LiquidityPools() {
  const [pools, setPools] = useState<LiquidityPool[]>([])
  const [isAddLiquidityOpen, setIsAddLiquidityOpen] = useState(false)
  const [selectedPool, setSelectedPool] = useState<string>("")
  const [liquidityAmount, setLiquidityAmount] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchLiquidityPools()
  }, [fetchLiquidityPools])

  const fetchLiquidityPools = async () => {
    // Mock data since we don't have the table yet
    const mockPools: LiquidityPool[] = [
      {
        id: "1",
        pool_name: "GOLD/USD Pool",
        token_a: "GOLD",
        token_b: "USD",
        token_a_balance: 1250.50,
        token_b_balance: 2500000.00,
        total_liquidity: 3750000.00,
        apy: 12.5,
        pool_type: "commodity",
        is_active: true
      },
      {
        id: "2", 
        pool_name: "SILVER/USD Pool",
        token_a: "SILVER",
        token_b: "USD",
        token_a_balance: 50000.25,
        token_b_balance: 1250000.00,
        total_liquidity: 1875000.00,
        apy: 8.3,
        pool_type: "commodity",
        is_active: true
      },
      {
        id: "3",
        pool_name: "BTC/USD Bonded",
        token_a: "BTC",
        token_b: "USD",
        token_a_balance: 25.5,
        token_b_balance: 1500000.00,
        total_liquidity: 2250000.00,
        apy: 15.7,
        pool_type: "bonded",
        lock_period: 90,
        is_active: true
      }
    ]
    
    setPools(mockPools)
  }

  const handleAddLiquidity = () => {
    setIsAddLiquidityOpen(true)
  }

  const handleViewCommodityPools = () => {
    toast({
      title: "Commodity Pools",
      description: "Showing commodity-backed liquidity pools",
    })
  }

  const handleBondLiquidity = () => {
    toast({
      title: "Bond Liquidity", 
      description: "Opening bonded liquidity options with lock periods",
    })
  }

  const handleViewTimers = () => {
    toast({
      title: "Interest Timers",
      description: "Viewing time-locked liquidity positions and rewards",
    })
  }

  const handleProvideLiquidity = async () => {
    if (!selectedPool || !liquidityAmount) {
      toast({
        title: "Missing Information",
        description: "Please select a pool and enter an amount",
        variant: "destructive"
      })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to provide liquidity",
        variant: "destructive"
      })
      return
    }

    const pool = pools.find(p => p.id === selectedPool)
    if (!pool) return

    // Create liquidity position in database
    const amount = parseFloat(liquidityAmount)
    const lpTokens = amount * 0.95 // 5% fee
    
    const { error } = await supabase
      .from('liquidity_pool_positions')
      .insert({
        user_id: user.id,
        pool_id: selectedPool,
        token_a_amount: amount / 2, // Split between tokens
        token_b_amount: amount / 2,
        lp_tokens: lpTokens,
        entry_price: amount,
        current_value: amount,
        is_active: true
      })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add liquidity position",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Liquidity Added",
      description: `Added $${liquidityAmount} to ${pool.pool_name}`,
    })

    setIsAddLiquidityOpen(false)
    setSelectedPool("")
    setLiquidityAmount("")
  }

  const handleRemoveLiquidity = async (poolId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to remove liquidity",
        variant: "destructive"
      })
      return
    }

    const pool = pools.find(p => p.id === poolId)
    if (!pool) return

    // Find user's liquidity position
    const { data: positions, error } = await supabase
      .from('liquidity_pool_positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('pool_id', poolId)
      .eq('is_active', true)

    if (error || !positions || positions.length === 0) {
      toast({
        title: "No Position Found",
        description: "You don't have an active liquidity position in this pool",
        variant: "destructive"
      })
      return
    }

    const position = positions[0]
    
    // Update position to inactive
    const { error: updateError } = await supabase
      .from('liquidity_pool_positions')
      .update({ is_active: false })
      .eq('id', position.id)

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to remove liquidity position",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Liquidity Removed",
      description: `Successfully removed liquidity from ${pool.pool_name}`,
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liquidity Pools</h1>
          <p className="text-muted-foreground">Provide liquidity and earn rewards</p>
        </div>
        <Button onClick={handleAddLiquidity}>
          <Droplets className="h-4 w-4 mr-2" />
          Add Liquidity
        </Button>
      </div>

      {/* Pool Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleViewCommodityPools}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Commodity Pools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Pools backed by physical commodities like gold and silver
            </p>
            <Button variant="outline" className="w-full">View Pools</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleBondLiquidity}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Bonded Liquidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Lock liquidity for higher yields with time commitments
            </p>
            <Button variant="outline" className="w-full">Bond Liquidity</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleViewTimers}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Interest Timers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track time-locked positions and upcoming reward distributions
            </p>
            <Button variant="outline" className="w-full">View Timers</Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Pools */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Liquidity Pools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pools.map((pool) => (
            <Card key={pool.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{pool.pool_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{pool.token_a}/{pool.token_b}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="mb-1">
                      {pool.apy}% APY
                    </Badge>
                    <br />
                    <Badge variant="outline">
                      {pool.pool_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Liquidity:</span>
                    <span className="font-medium">${pool.total_liquidity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{pool.token_a} Balance:</span>
                    <span className="font-medium">{pool.token_a_balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{pool.token_b} Balance:</span>
                    <span className="font-medium">${pool.token_b_balance.toLocaleString()}</span>
                  </div>
                  {pool.lock_period && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lock Period:</span>
                      <span className="font-medium">{pool.lock_period} days</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => {
                      setSelectedPool(pool.id)
                      setIsAddLiquidityOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleRemoveLiquidity(pool.id)}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Liquidity Modal */}
      {isAddLiquidityOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Liquidity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pool">Select Pool</Label>
                <select 
                  id="pool"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={selectedPool}
                  onChange={(e) => setSelectedPool(e.target.value)}
                >
                  <option value="">Select a pool...</option>
                  {pools.map((pool) => (
                    <option key={pool.id} value={pool.id}>
                      {pool.pool_name} - {pool.apy}% APY
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={liquidityAmount}
                  onChange={(e) => setLiquidityAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {selectedPool && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Estimated LP Tokens:</span>
                      <span>{liquidityAmount ? (parseFloat(liquidityAmount) * 0.95).toFixed(2) : "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pool Share:</span>
                      <span>{liquidityAmount ? "0.01%" : "0.00%"}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleProvideLiquidity} className="flex-1">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Liquidity
                </Button>
                <Button variant="outline" onClick={() => setIsAddLiquidityOpen(false)}>
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