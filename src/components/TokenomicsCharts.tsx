import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { VelocityData, SupplyAnalytics } from "@/hooks/useTokenomicsData";
import { format } from "date-fns";

interface TokenomicsChartsProps {
  velocityData: VelocityData[];
  supplyAnalytics: SupplyAnalytics[];
  loading: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function TokenomicsCharts({ velocityData, supplyAnalytics, loading }: TokenomicsChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatVelocityData = velocityData.map(data => ({
    ...data,
    time: format(new Date(data.timestamp), "HH:mm"),
    velocity: Number(data.velocity.toFixed(4)),
    volume: Number(data.volume.toFixed(2)),
  }));

  const chartConfig = {
    velocity: {
      label: "Velocity",
      color: "hsl(var(--primary))",
    },
    volume: {
      label: "Volume",
      color: "hsl(var(--secondary))",
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Velocity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Token Velocity (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <AreaChart data={formatVelocityData}>
              <defs>
                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="velocity"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#velocityGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Volume (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <LineChart data={formatVelocityData}>
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: "hsl(var(--secondary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Supply Distribution */}
      {supplyAnalytics.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Token Supply Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supplyAnalytics.slice(0, 2).map((asset, index) => {
                const distributionData = [
                  { name: "Public", value: asset.distributionBreakdown.public },
                  { name: "Team", value: asset.distributionBreakdown.team },
                  { name: "Treasury", value: asset.distributionBreakdown.treasury },
                  { name: "Ecosystem", value: asset.distributionBreakdown.ecosystem },
                ];

                return (
                  <div key={asset.tokenSymbol} className="space-y-4">
                    <h4 className="font-medium text-center">{asset.tokenSymbol}</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={distributionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                        >
                          {distributionData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0];
                              return (
                                <div className="bg-background border rounded-lg p-2 shadow-md">
                                  <p className="font-medium">{data.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {Number(data.value).toLocaleString()} tokens
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {distributionData.map((entry, idx) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <span>{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}