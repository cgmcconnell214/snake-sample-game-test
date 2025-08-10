import React from "react";
import { Helmet } from "react-helmet";
import { AITradingBot } from "@/components/AITradingBot";

const AITradingBots = (): JSX.Element => {
  return (
    <div className="space-y-6 p-6">
      <Helmet>
        <title>AI Trading Bots</title>
        <meta
          name="description"
          content="Automated trading strategies powered by artificial intelligence"
        />
      </Helmet>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Trading Bots</h1>
          <p className="text-muted-foreground">
            Automated trading strategies powered by artificial intelligence
          </p>
        </div>
      </div>

      <AITradingBot />
    </div>
  );
};

export default AITradingBots;
