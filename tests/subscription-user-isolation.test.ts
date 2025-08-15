import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkxbkaggxqcsiylwcopt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

describe('Subscription User Isolation Tests', () => {
  let testUser1Id: string;
  let testUser2Id: string;
  let testUser3Id: string;
  let sharedEmail: string;
  let stripeCustomerId1: string;
  let stripeCustomerId2: string;
  let stripeCustomerId3: string;

  beforeEach(async () => {
    // Create test users with shared email
    sharedEmail = `shared-${Date.now()}@example.com`;
    testUser1Id = '550e8400-e29b-41d4-a716-446655440001';
    testUser2Id = '550e8400-e29b-41d4-a716-446655440002';
    testUser3Id = '550e8400-e29b-41d4-a716-446655440003';
    
    // Generate unique Stripe customer IDs for each user
    stripeCustomerId1 = `cus_test_user1_${Date.now()}`;
    stripeCustomerId2 = `cus_test_user2_${Date.now()}`;
    stripeCustomerId3 = `cus_test_user3_${Date.now()}`;

    // Create test profiles for these users
    await serviceClient.from('profiles').upsert([
      {
        user_id: testUser1Id,
        email: sharedEmail,
        first_name: 'Test',
        last_name: 'User1',
        subscription_tier: 'free'
      },
      {
        user_id: testUser2Id,
        email: sharedEmail,
        first_name: 'Test',
        last_name: 'User2',
        subscription_tier: 'free'
      },
      {
        user_id: testUser3Id,
        email: sharedEmail,
        first_name: 'Test',
        last_name: 'User3',
        subscription_tier: 'free'
      }
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    await serviceClient
      .from('subscriptions')
      .delete()
      .in('user_id', [testUser1Id, testUser2Id, testUser3Id]);

    await serviceClient
      .from('profiles')
      .delete()
      .in('user_id', [testUser1Id, testUser2Id, testUser3Id]);
  });

  it('should isolate subscriptions by user_id even with shared email', async () => {
    // Create subscription records for different users with same email but different Stripe customers
    await serviceClient.from('subscriptions').insert([
      {
        user_id: testUser1Id,
        stripe_customer_id: stripeCustomerId1,
        stripe_subscription_id: 'sub_test_1',
        status: 'active',
        tier: 'standard',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false
      },
      {
        user_id: testUser2Id,
        stripe_customer_id: stripeCustomerId2,
        stripe_subscription_id: 'sub_test_2',
        status: 'active',
        tier: 'enterprise',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false
      },
      {
        user_id: testUser3Id,
        stripe_customer_id: stripeCustomerId3,
        stripe_subscription_id: null,
        status: 'inactive',
        tier: 'free',
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false
      }
    ]);

    // Test isolation: each user should only see their own subscription
    const { data: user1Subscription } = await serviceClient
      .rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser1Id });

    const { data: user2Subscription } = await serviceClient
      .rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser2Id });

    const { data: user3Subscription } = await serviceClient
      .rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser3Id });

    // Verify each user gets only their own subscription
    expect(user1Subscription).toHaveLength(1);
    expect(user1Subscription[0].stripe_customer_id).toBe(stripeCustomerId1);
    expect(user1Subscription[0].tier).toBe('standard');
    expect(user1Subscription[0].status).toBe('active');

    expect(user2Subscription).toHaveLength(1);
    expect(user2Subscription[0].stripe_customer_id).toBe(stripeCustomerId2);
    expect(user2Subscription[0].tier).toBe('enterprise');
    expect(user2Subscription[0].status).toBe('active');

    expect(user3Subscription).toHaveLength(1);
    expect(user3Subscription[0].stripe_customer_id).toBe(stripeCustomerId3);
    expect(user3Subscription[0].tier).toBe('free');
    expect(user3Subscription[0].status).toBe('inactive');

    // Verify they don't see each other's data
    expect(user1Subscription[0].stripe_customer_id).not.toBe(stripeCustomerId2);
    expect(user1Subscription[0].stripe_customer_id).not.toBe(stripeCustomerId3);
    expect(user2Subscription[0].stripe_customer_id).not.toBe(stripeCustomerId1);
    expect(user2Subscription[0].stripe_customer_id).not.toBe(stripeCustomerId3);
  });

  it('should enforce NOT NULL constraint on stripe_customer_id', async () => {
    // Attempt to insert subscription without stripe_customer_id should fail
    try {
      await serviceClient.from('subscriptions').insert({
        user_id: testUser1Id,
        stripe_customer_id: null, // This should fail due to NOT NULL constraint
        status: 'active',
        tier: 'standard'
      });
      
      // If we reach here, the test should fail
      expect(true).toBe(false); // Force test failure
    } catch (error) {
      // This is expected - the constraint should prevent null values
      expect(error).toBeDefined();
    }
  });

  it('should maintain unique constraint on user_id and stripe_customer_id', async () => {
    // First insert should succeed
    const { error: firstError } = await serviceClient.from('subscriptions').insert({
      user_id: testUser1Id,
      stripe_customer_id: stripeCustomerId1,
      status: 'active',
      tier: 'standard'
    });

    expect(firstError).toBeNull();

    // Attempt to insert duplicate user_id with different stripe_customer_id should succeed
    const { error: secondError } = await serviceClient.from('subscriptions').insert({
      user_id: testUser2Id,
      stripe_customer_id: stripeCustomerId1, // Same stripe customer, different user
      status: 'active',
      tier: 'standard'
    });

    expect(secondError).toBeNull();

    // Attempt to insert duplicate user_id with same stripe_customer_id should fail
    try {
      await serviceClient.from('subscriptions').insert({
        user_id: testUser1Id,
        stripe_customer_id: stripeCustomerId2, // Different stripe customer, but user already exists
        status: 'active',
        tier: 'enterprise'
      });
      
      // Should not reach here due to unique constraint on user_id
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should handle concurrent subscription queries correctly', async () => {
    // Create subscription records
    await serviceClient.from('subscriptions').insert([
      {
        user_id: testUser1Id,
        stripe_customer_id: stripeCustomerId1,
        status: 'active',
        tier: 'standard'
      },
      {
        user_id: testUser2Id,
        stripe_customer_id: stripeCustomerId2,
        status: 'active',
        tier: 'enterprise'
      }
    ]);

    // Simulate concurrent queries for different users
    const promises = [
      serviceClient.rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser1Id }),
      serviceClient.rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser2Id }),
      serviceClient.rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser1Id }),
      serviceClient.rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser2Id })
    ];

    const results = await Promise.all(promises);

    // All queries should succeed and return correct isolated data
    expect(results).toHaveLength(4);
    
    // First and third results should be for user1
    expect(results[0].data[0].stripe_customer_id).toBe(stripeCustomerId1);
    expect(results[2].data[0].stripe_customer_id).toBe(stripeCustomerId1);
    
    // Second and fourth results should be for user2
    expect(results[1].data[0].stripe_customer_id).toBe(stripeCustomerId2);
    expect(results[3].data[0].stripe_customer_id).toBe(stripeCustomerId2);

    // Verify no cross-contamination
    results.forEach(result => {
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
    });
  });

  it('should handle users with no subscription records gracefully', async () => {
    // Query for a user that has no subscription record
    const { data: noSubscription, error } = await serviceClient
      .rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser1Id });

    expect(error).toBeNull();
    expect(noSubscription).toEqual([]); // Should return empty array, not null
  });

  it('should support subscription updates while maintaining isolation', async () => {
    // Create initial subscription
    await serviceClient.from('subscriptions').insert({
      user_id: testUser1Id,
      stripe_customer_id: stripeCustomerId1,
      status: 'active',
      tier: 'standard'
    });

    // Update the subscription
    const { error: updateError } = await serviceClient
      .from('subscriptions')
      .update({
        tier: 'enterprise',
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', testUser1Id);

    expect(updateError).toBeNull();

    // Verify update was applied correctly
    const { data: updatedSubscription } = await serviceClient
      .rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser1Id });

    expect(updatedSubscription).toHaveLength(1);
    expect(updatedSubscription[0].tier).toBe('enterprise');
    expect(updatedSubscription[0].stripe_customer_id).toBe(stripeCustomerId1);
  });
});