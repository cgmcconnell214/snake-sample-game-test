import React, { Suspense } from "react";
import { Helmet } from "react-helmet";
import { AITradingBot } from "@/components/AITradingBot";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";

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
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <AITradingBot />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default AITradingBots;
