import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RealTimeTrading from "@/components/RealTimeTrading";
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Volume2,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const marketData = [
  {
    symbol: "GOLD-TOKEN",
    name: "Premium Gold Bars",
    price: 131.2,
    change: 2.4,
    volume: 1250000,
    marketCap: 164000000,
    type: "commodity",
    status: "active",
  },
  {
    symbol: "SILVER-TOKEN",
    name: "Silver Bullion",
    price: 10.15,
    change: -1.2,
    volume: 890000,
    marketCap: 8630000,
    type: "commodity",
    status: "active",
  },
  {
    symbol: "OIL-FUTURE",
    name: "Crude Oil Futures Q1",
    price: 84.5,
    change: 5.7,
    volume: 2100000,
    marketCap: 42250000,
    type: "derivative",
    status: "active",
  },
  {
    symbol: "REAL-ESTATE-A",
    name: "Manhattan Office Complex",
    price: 2500.0,
    change: 1.8,
    volume: 150000,
    marketCap: 25000000,
    type: "real-estate",
    status: "pending",
  },
  {
    symbol: "TECH-EQUITY-B",
    name: "Tech Startup Equity B",
    price: 45.75,
    change: -3.2,
    volume: 567000,
    marketCap: 4575000,
    type: "equity",
    status: "active",
  },
];

const openOrders = [
  {
    id: "ORD001",
    symbol: "GOLD-TOKEN",
    type: "LIMIT_BUY",
    quantity: 25,
    price: 130.5,
    filled: 0,
    status: "open",
    time: "2024-01-15 14:23:15",
  },
  {
    id: "ORD002",
    symbol: "SILVER-TOKEN",
    type: "LIMIT_SELL",
    quantity: 100,
    price: 10.25,
    filled: 0,
    status: "open",
    time: "2024-01-15 13:45:30",
  },
  {
    id: "ORD003",
    symbol: "OIL-FUTURE",
    type: "STOP_LOSS",
    quantity: 10,
    price: 82.0,
    filled: 0,
    status: "pending",
    time: "2024-01-15 12:12:08",
  },
];

export default function Trading(): JSX.Element {
  return <RealTimeTrading />;
}
