import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Droplets, Lock, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function LiquidityPools(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [totalPools, setTotalPools] = useState(0);
  const [totalLiquidity, setTotalLiquidity] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/pools.json");
        const data = await response.json();
        setTotalPools(data.length);
        const liquidity = data.reduce(
          (sum: number, pool: { total_liquidity: number }) =>
            sum + pool.total_liquidity,
          0,
        );
        setTotalLiquidity(liquidity);
      } catch (error) {
        console.error("Failed to load pool statistics", error);
        toast({
          title: "Error",
          description: "Unable to load pool statistics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  const handleAddLiquidity = () => {
    navigate("/app/liquidity/pools");
  };

  const handleViewPools = () => {
    navigate("/app/liquidity/pools");
  };

  const handleBondLiquidity = () => {
    navigate("/app/liquidity/pools");
  };

  const handleViewTimers = () => {
    navigate("/app/liquidity/pools");
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liquidity Pools</h1>
          <p className="text-muted-foreground">
            Provide liquidity and earn rewards
          </p>
        </div>
        <Button onClick={handleAddLiquidity}>
          <Droplets className="h-4 w-4 mr-2" />
          Add Liquidity
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading pool statistics...</div>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Active Pools: {totalPools}
            </p>
            <p className="text-sm text-muted-foreground">
              Total Liquidity: ${totalLiquidity.toLocaleString()}
            </p>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleViewPools}
                >
                  View Pools
                </Button>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleBondLiquidity}
                >
                  Bond Liquidity
                </Button>
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleViewTimers}
                >
                  View Timers
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
