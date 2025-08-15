import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Create Order Security Tests', () => {
  let supabase: any;
  let testUserId: string;
  let testAssetId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'test-security@example.com',
      password: 'testpassword123',
      email_confirm: true
    });
    
    if (userError) throw userError;
    testUserId = userData.user.id;

    // Create test asset
    const { data: assetData, error: assetError } = await supabase
      .from('tokenized_assets')
      .insert({
        creator_id: testUserId,
        asset_symbol: 'TESTSEC',
        asset_name: 'Test Security Asset',
        description: 'Test asset for security testing',
        total_supply: 1000000,
        is_active: true
      })
      .select()
      .single();
    
    if (assetError) throw assetError;
    testAssetId = assetData.id;

    // Create test profile with subscription
    await supabase
      .from('profiles')
      .upsert({
        user_id: testUserId,
        subscription_tier: 'standard',
        email: 'test-security@example.com'
      });
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('orders').delete().eq('user_id', testUserId);
    await supabase.from('tokenized_assets').delete().eq('id', testAssetId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  describe('SQL Injection Prevention', () => {
    test('should reject malicious asset_id with SQL injection attempt', async () => {
      const maliciousAssetId = "'; DROP TABLE orders; --";
      
      const { data, error } = await supabase.rpc('create_order_secure', {
        p_user_id: testUserId,
        p_asset_id: maliciousAssetId,
        p_order_type: 'market',
        p_side: 'buy',
        p_quantity: 100,
        p_price: null,
        p_expires_at: null
      });

      expect(error).toBeTruthy();
      expect(error.message).toContain('invalid input syntax for type uuid');
    });

    test('should reject malicious order_type with SQL injection', async () => {
      const maliciousOrderType = "market'; DELETE FROM orders WHERE '1'='1";
      
      const { data } = await supabase.rpc('create_order_secure', {
        p_user_id: testUserId,
        p_asset_id: testAssetId,
        p_order_type: maliciousOrderType,
        p_side: 'buy',
        p_quantity: 100,
        p_price: null,
        p_expires_at: null
      });

      const result = data[0];
      expect(result.success).toBe(false);
      expect(result.error_message).toContain('Invalid order type');
    });

    test('should reject malicious side with union injection attempt', async () => {
      const maliciousSide = "buy' UNION SELECT * FROM profiles WHERE '1'='1";
      
      const { data } = await supabase.rpc('create_order_secure', {
        p_user_id: testUserId,
        p_asset_id: testAssetId,
        p_order_type: 'market',
        p_side: maliciousSide,
        p_quantity: 100,
        p_price: null,
        p_expires_at: null
      });

      const result = data[0];
      expect(result.success).toBe(false);
      expect(result.error_message).toContain('Invalid order side');
    });

    test('should reject numeric injection in quantity field', async () => {
      // Test various numeric injection attempts
      const maliciousQuantities = [
        "100; DROP TABLE orders; --",
        "100 OR 1=1",
        "CAST((SELECT COUNT(*) FROM profiles) AS NUMERIC)",
        "(SELECT MAX(balance) FROM asset_holdings)"
      ];

      for (const maliciousQuantity of maliciousQuantities) {
        const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            asset_id: testAssetId,
            order_type: 'market',
            side: 'buy',
            quantity: maliciousQuantity
          })
        });

        const result = await response.json();
        expect(response.status).toBe(500);
        expect(result.error).toContain('must be a valid number');
      }
    });

    test('should validate UUID format strictly', async () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '12345',
        '00000000-0000-0000-0000-000000000000\'; DROP TABLE orders; --',
        'SELECT id FROM tokenized_assets LIMIT 1',
        '../../../etc/passwd'
      ];

      for (const invalidUUID of invalidUUIDs) {
        const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            asset_id: invalidUUID,
            order_type: 'market',
            side: 'buy',
            quantity: 100
          })
        });

        const result = await response.json();
        expect(response.status).toBe(500);
        expect(result.error).toContain('must be a valid UUID');
      }
    });
  });

  describe('Input Validation Security', () => {
    test('should enforce numeric field bounds', async () => {
      // Test extreme values
      const extremeValues = [
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Infinity,
        -Infinity,
        NaN
      ];

      for (const extremeValue of extremeValues) {
        const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            asset_id: testAssetId,
            order_type: 'market',
            side: 'buy',
            quantity: extremeValue
          })
        });

        const result = await response.json();
        expect(response.status).toBe(500);
        expect(result.error).toMatch(/must be a valid number|must not exceed|must be at least/);
      }
    });

    test('should reject negative quantities and prices', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset_id: testAssetId,
          order_type: 'limit',
          side: 'buy',
          quantity: -100,
          price: -50
        })
      });

      const result = await response.json();
      expect(response.status).toBe(500);
      expect(result.error).toContain('must be at least');
    });

    test('should validate expires_at format', async () => {
      const invalidDates = [
        'not-a-date',
        '2021-13-45',
        'DROP TABLE orders',
        '1970-01-01', // Past date
        '"><script>alert(1)</script>'
      ];

      for (const invalidDate of invalidDates) {
        const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            asset_id: testAssetId,
            order_type: 'limit',
            side: 'buy',
            quantity: 100,
            price: 50,
            expires_at: invalidDate
          })
        });

        const result = await response.json();
        expect(response.status).toBe(500);
        expect(result.error).toMatch(/expires_at must be a valid future date/);
      }
    });
  });

  describe('Business Logic Security', () => {
    test('should create valid order successfully', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const { data } = await supabase.rpc('create_order_secure', {
        p_user_id: testUserId,
        p_asset_id: testAssetId,
        p_order_type: 'limit',
        p_side: 'buy',
        p_quantity: 100,
        p_price: 50,
        p_expires_at: futureDate
      });

      const result = data[0];
      expect(result.success).toBe(true);
      expect(result.order_id).toBeTruthy();
      expect(result.error_message).toBeNull();
    });

    test('should prevent order creation for non-existent asset', async () => {
      const fakeAssetId = '00000000-0000-0000-0000-000000000000';
      
      const { data } = await supabase.rpc('create_order_secure', {
        p_user_id: testUserId,
        p_asset_id: fakeAssetId,
        p_order_type: 'market',
        p_side: 'buy',
        p_quantity: 100,
        p_price: null,
        p_expires_at: null
      });

      const result = data[0];
      expect(result.success).toBe(false);
      expect(result.error_message).toContain('Asset not found or inactive');
    });

    test('should log validation failures', async () => {
      // This would normally be tested by checking the security_events table
      // after attempting malicious requests through the API endpoint
      const response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset_id: "'; DROP TABLE orders; --",
          order_type: 'market',
          side: 'buy',
          quantity: 100
        })
      });

      expect(response.status).toBe(500);
      
      // Verify that the security event was logged
      const { data: securityEvents } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', testUserId)
        .eq('event_type', 'validation_failure')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(securityEvents).toBeTruthy();
      expect(securityEvents[0]?.event_data?.failure_type).toBe('input_validation');
    });
  });

  describe('Rate Limiting and Monitoring', () => {
    test('should track failed validation attempts', async () => {
      // Make multiple malicious requests
      for (let i = 0; i < 3; i++) {
        await fetch(`${supabaseUrl}/functions/v1/create-order`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            asset_id: `malicious-${i}`,
            order_type: 'market',
            side: 'buy',
            quantity: 100
          })
        });
      }

      // Check that multiple validation failures were logged
      const { data: securityEvents } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', testUserId)
        .eq('event_type', 'validation_failure')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Last minute

      expect(securityEvents?.length).toBeGreaterThanOrEqual(3);
    });
  });
});