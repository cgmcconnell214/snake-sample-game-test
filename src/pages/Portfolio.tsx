import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Briefcase, DollarSign } from 'lucide-react';

const Portfolio = () => {
  const portfolioData = [
    { symbol: 'XRPL-USD', name: 'XRPL USD Stable', balance: 5000, value: 5000, change: 0.12 },
    { symbol: 'XRPL-GOLD', name: 'Tokenized Gold', balance: 2.5, value: 4750, change: -1.24 },
    { symbol: 'XRPL-RE1', name: 'Real Estate Token 1', balance: 100, value: 12500, change: 3.45 },
    { symbol: 'XRPL-CORP', name: 'Corporate Bond Token', balance: 50, value: 7800, change: 0.89 },
  ];

  const totalValue = portfolioData.reduce((sum, asset) => sum + asset.value, 0);
  const totalGain = portfolioData.reduce((sum, asset) => sum + (asset.value * asset.change / 100), 0);
  const totalGainPercent = (totalGain / totalValue) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <Badge variant="outline" className="text-sm">
          <Briefcase className="w-4 h-4 mr-1" />
          {portfolioData.length} Assets
        </Badge>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Portfolio value
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Change</CardTitle>
            {totalGainPercent >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${totalGain >= 0 ? '+' : ''}{totalGain.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assets</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioData.length}</div>
            <p className="text-xs text-muted-foreground">
              Different tokens
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>
            Your tokenized assets and their current values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolioData.map((asset, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {asset.symbol.split('-')[1]?.slice(0, 2) || 'TK'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{asset.balance} tokens</p>
                  <p className="text-sm text-muted-foreground">${asset.value.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <Badge variant={asset.change >= 0 ? 'default' : 'destructive'}>
                    {asset.change >= 0 ? '+' : ''}{asset.change}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;