import React, { Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { AITradingBot } from "@/components/AITradingBot";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";

const AITradingBots = (): JSX.Element => {
  const canonicalUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/app/ai-trading-bots";
  return (
    <div className="space-y-6 p-6">
      <Helmet>
        <title>AI Trading Bots | Automated Trading Strategies</title>
        <meta name="description" content="Automated AI trading strategies with performance insights" />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Trading Bots</h1>
          <p className="text-muted-foreground">
            Automated trading strategies powered by artificial intelligence
          </p>
        </div>
      </div>

      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <AITradingBot />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default AITradingBots;
