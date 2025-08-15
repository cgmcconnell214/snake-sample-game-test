-- Create stored procedures for secure order operations

-- Function to create order with proper validation and SQL injection protection
CREATE OR REPLACE FUNCTION public.create_order_secure(
  p_user_id uuid,
  p_asset_id uuid,
  p_order_type text,
  p_side text,
  p_quantity numeric,
  p_price numeric DEFAULT NULL,
  p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
  order_id uuid,
  success boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_asset_exists boolean;
  v_user_balance numeric := 0;
  v_locked_balance numeric := 0;
  v_available_balance numeric := 0;
BEGIN
  -- Initialize return values
  order_id := NULL;
  success := false;
  error_message := NULL;

  -- Validate order type
  IF p_order_type NOT IN ('market', 'limit', 'stop_loss', 'take_profit') THEN
    error_message := 'Invalid order type';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Validate side
  IF p_side NOT IN ('buy', 'sell') THEN
    error_message := 'Invalid order side';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Validate quantity
  IF p_quantity <= 0 THEN
    error_message := 'Quantity must be positive';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Validate price for limit orders
  IF p_order_type IN ('limit', 'stop_loss', 'take_profit') AND (p_price IS NULL OR p_price <= 0) THEN
    error_message := 'Price required and must be positive for limit/stop orders';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Check if asset exists
  SELECT EXISTS(
    SELECT 1 FROM tokenized_assets 
    WHERE id = p_asset_id AND is_active = true
  ) INTO v_asset_exists;

  IF NOT v_asset_exists THEN
    error_message := 'Asset not found or inactive';
    RETURN NEXT;
    RETURN;
  END IF;

  -- For sell orders, check user has sufficient balance
  IF p_side = 'sell' THEN
    SELECT 
      COALESCE(balance, 0),
      COALESCE(locked_balance, 0)
    INTO v_user_balance, v_locked_balance
    FROM asset_holdings
    WHERE user_id = p_user_id AND asset_id = p_asset_id;

    v_available_balance := v_user_balance - v_locked_balance;
    
    IF v_available_balance < p_quantity THEN
      error_message := 'Insufficient balance for sell order';
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;

  BEGIN
    -- Create the order
    INSERT INTO orders (
      user_id,
      asset_id,
      order_type,
      side,
      quantity,
      price,
      filled_quantity,
      remaining_quantity,
      status,
      expires_at
    ) VALUES (
      p_user_id,
      p_asset_id,
      p_order_type,
      p_side,
      p_quantity,
      p_price,
      0,
      p_quantity,
      'pending',
      p_expires_at
    ) RETURNING id INTO v_order_id;

    -- Lock assets for sell orders
    IF p_side = 'sell' THEN
      UPDATE asset_holdings
      SET 
        locked_balance = locked_balance + p_quantity,
        last_updated = now()
      WHERE user_id = p_user_id AND asset_id = p_asset_id;

      -- Verify the update worked
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to lock assets';
      END IF;
    END IF;

    -- Return success
    order_id := v_order_id;
    success := true;
    RETURN NEXT;

  EXCEPTION
    WHEN OTHERS THEN
      error_message := SQLERRM;
      RETURN NEXT;
  END;
END;
$$;

-- Function to update order quantities safely
CREATE OR REPLACE FUNCTION public.update_order_execution(
  p_order_id uuid,
  p_match_order_id uuid,
  p_execution_quantity numeric,
  p_execution_price numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_record orders%ROWTYPE;
  v_match_record orders%ROWTYPE;
BEGIN
  -- Get order details with row locking
  SELECT * INTO v_order_record
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  SELECT * INTO v_match_record
  FROM orders
  WHERE id = p_match_order_id
  FOR UPDATE;

  -- Validate orders exist and have sufficient quantity
  IF NOT FOUND OR v_order_record.remaining_quantity < p_execution_quantity 
     OR v_match_record.remaining_quantity < p_execution_quantity THEN
    RETURN false;
  END IF;

  -- Update both orders atomically
  UPDATE orders
  SET 
    filled_quantity = filled_quantity + p_execution_quantity,
    remaining_quantity = remaining_quantity - p_execution_quantity,
    status = CASE 
      WHEN remaining_quantity - p_execution_quantity <= 0 THEN 'filled'
      ELSE 'partially_filled'
    END,
    updated_at = now()
  WHERE id IN (p_order_id, p_match_order_id);

  RETURN true;
END;
$$;

-- Function to log validation failures securely
CREATE OR REPLACE FUNCTION public.log_validation_failure(
  p_user_id uuid,
  p_failure_type text,
  p_details jsonb,
  p_client_info jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_events (
    user_id,
    event_type,
    event_data,
    risk_score,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    'validation_failure',
    jsonb_build_object(
      'failure_type', p_failure_type,
      'details', p_details,
      'timestamp', now()
    ),
    CASE p_failure_type
      WHEN 'url_validation' THEN 6
      WHEN 'input_validation' THEN 4
      WHEN 'sql_injection_attempt' THEN 9
      ELSE 5
    END,
    CASE WHEN p_client_info ? 'ip' THEN (p_client_info->>'ip')::inet ELSE NULL END,
    p_client_info->>'userAgent'
  );
END;
$$;