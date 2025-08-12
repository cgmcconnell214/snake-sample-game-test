import RealTimeTrading from "@/components/RealTimeTrading";
import { useTradingData } from "@/hooks/useTradingData";
import Seo from "@/components/Seo";

export default function Trading(): JSX.Element {
  const { assets, orders, loading, cancelOrder } = useTradingData();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const canonicalUrl = origin + "/app/trading";
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Trading",
    url: canonicalUrl,
  };
  return (
    <>
      <Seo title="Trading | Real-Time XRPL Trading" description="Execute and manage orders with real-time market data on XRPL." canonical={canonicalUrl} />
      <script type="application/ld+json">{JSON.stringify(webPageLd)}</script>
      <RealTimeTrading
        assets={assets}
        orders={orders}
        loading={loading}
        cancelOrder={cancelOrder}
      />
    </>
  );
}

