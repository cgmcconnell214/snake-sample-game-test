import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";

interface SupplyData {
  circulating: number;
  total: number;
}

interface DistributionDatum {
  name: string;
  value: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AA00FF",
  "#FF00AA",
  "#00AAFF",
  "#AAFF00",
  "#FFAA00",
  "#00FFAA",
  "#CCCCCC"
];

export default function TokenSupply(): JSX.Element {
  const [supply, setSupply] = useState<SupplyData | null>(null);
  const [distribution, setDistribution] = useState<DistributionDatum[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch supply metrics from Coingecko
        const supplyRes = await fetch(
          "https://api.coingecko.com/api/v3/coins/tether?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false"
        );
        const supplyJson = await supplyRes.json();
        setSupply({
          circulating: supplyJson.market_data.circulating_supply,
          total: supplyJson.market_data.total_supply
        });

        // Fetch distribution metrics from Ethplorer
        const tokenAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";
        const distRes = await fetch(
          `https://api.ethplorer.io/getTopTokenHolders/${tokenAddress}?apiKey=freekey&limit=10`
        );
        const distJson = await distRes.json();
        const holders = distJson.holders || [];
        const distData: DistributionDatum[] = holders.map((h: any) => ({
          name: h.address,
          value: h.share
        }));
        const otherShare = Math.max(
          0,
          100 - distData.reduce((sum, d) => sum + d.value, 0)
        );
        distData.push({ name: "Others", value: otherShare });
        setDistribution(distData);
      } catch (error) {
        console.error("Error fetching token data", error);
        toast({
          title: "Error",
          description: "Failed to load token supply data",
          variant: "destructive"
        });
      }
    };

    fetchData();
  }, [toast]);

  if (!supply) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading token data...</div>
      </div>
    );
  }

  const supplyData = [
    { name: "Circulating", value: supply.circulating },
    { name: "Locked", value: Math.max(0, supply.total - supply.circulating) }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Token Supply & Distribution</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Supply Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={supplyData} dataKey="value" nameKey="name" label>
                  {supplyData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Holder Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" label>
                  {distribution.map((_, idx) => (
                    <Cell key={`cell-d-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

