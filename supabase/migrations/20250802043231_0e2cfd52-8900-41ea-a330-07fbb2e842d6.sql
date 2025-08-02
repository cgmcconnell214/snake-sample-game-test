-- Create missing tables for the trading system

-- Market data table for real-time price feeds
CREATE TABLE IF NOT EXISTS market_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES tokenized_assets(id) ON DELETE CASCADE,
  current_price NUMERIC NOT NULL DEFAULT 0,
  price_change_24h NUMERIC NOT NULL DEFAULT 0,
  volume_24h NUMERIC NOT NULL DEFAULT 0,
  market_cap NUMERIC NOT NULL DEFAULT 0,
  high_24h NUMERIC NOT NULL DEFAULT 0,
  low_24h NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

-- Create policies for market data
CREATE POLICY "Market data is viewable by everyone" 
ON market_data 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage market data" 
ON market_data 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Add missing trade_executions table referenced in create-order function
CREATE TABLE IF NOT EXISTS trade_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  asset_symbol TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  order_id UUID REFERENCES orders(id),
  settlement_status TEXT NOT NULL DEFAULT 'pending',
  compliance_flags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE trade_executions ENABLE ROW LEVEL SECURITY;

-- Create policies for trade executions
CREATE POLICY "Users can view their trade executions" 
ON trade_executions 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "System can create trade executions" 
ON trade_executions 
FOR INSERT 
WITH CHECK (true);

-- Insert sample market data for existing tokenized assets
INSERT INTO market_data (asset_id, current_price, price_change_24h, volume_24h, market_cap, high_24h, low_24h) 
SELECT 
  id,
  CASE 
    WHEN asset_symbol = 'EGG' THEN 5.00
    ELSE (RANDOM() * 1000 + 10)::NUMERIC(10,2)
  END as current_price,
  (RANDOM() * 20 - 10)::NUMERIC(5,2) as price_change_24h,
  (RANDOM() * 1000000 + 100000)::NUMERIC(12,2) as volume_24h,
  (RANDOM() * 50000000 + 1000000)::NUMERIC(15,2) as market_cap,
  CASE 
    WHEN asset_symbol = 'EGG' THEN 5.25
    ELSE (RANDOM() * 1100 + 15)::NUMERIC(10,2)
  END as high_24h,
  CASE 
    WHEN asset_symbol = 'EGG' THEN 4.75
    ELSE (RANDOM() * 900 + 5)::NUMERIC(10,2)
  END as low_24h
FROM tokenized_assets 
WHERE is_active = true
ON CONFLICT DO NOTHING;

-- Create function to update market data timestamps
CREATE OR REPLACE FUNCTION update_market_data_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_market_data_timestamp
BEFORE UPDATE ON market_data
FOR EACH ROW
EXECUTE FUNCTION update_market_data_timestamp();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_market_data_asset_id ON market_data(asset_id);
CREATE INDEX IF NOT EXISTS idx_market_data_last_updated ON market_data(last_updated);
CREATE INDEX IF NOT EXISTS idx_trade_executions_buyer_id ON trade_executions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trade_executions_seller_id ON trade_executions(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_asset_id ON orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);