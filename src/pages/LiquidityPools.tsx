import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Layers, Droplets, Lock, Timer } from "lucide-react"

export default function LiquidityPools() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liquidity Pools</h1>
          <p className="text-muted-foreground">Provide liquidity and earn rewards</p>
        </div>
        <Button>
          <Droplets className="h-4 w-4 mr-2" />
          Add Liquidity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Commodity Pools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Pools backed by physical commodities
            </p>
            <Button variant="outline" className="w-full">View Pools</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Bonded Liquidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Long-term locked liquidity with higher rewards
            </p>
            <Button variant="outline" className="w-full">Bond Liquidity</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Interest Timers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track time-based interest accumulation
            </p>
            <Button variant="outline" className="w-full">View Timers</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}