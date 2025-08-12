import RealTimeTrading from "@/components/RealTimeTrading";
import { useTradingData } from "@/hooks/useTradingData";
import Seo from "@/components/Seo";

export default function Trading(): JSX.Element {
  const { assets, orders, loading, cancelOrder } = useTradingData();
  const canonicalUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/app/trading";
  return (
    <>
      <Seo title="Trading | Real-Time XRPL Trading" description="Execute and manage orders with real-time market data on XRPL." canonical={canonicalUrl} />
      <RealTimeTrading
        assets={assets}
        orders={orders}
        loading={loading}
        cancelOrder={cancelOrder}
      />
    </>
  );
}
