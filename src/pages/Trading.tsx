import RealTimeTrading from "@/components/RealTimeTrading";
import { useTradingData } from "@/hooks/useTradingData";

export default function Trading(): JSX.Element {
  const { assets, orders, loading, cancelOrder } = useTradingData();
  return (
    <RealTimeTrading
      assets={assets}
      orders={orders}
      loading={loading}
      cancelOrder={cancelOrder}
    />
  );
}
