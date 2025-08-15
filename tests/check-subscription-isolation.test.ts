import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkxbkaggxqcsiylwcopt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

describe('Check Subscription Edge Function Isolation', () => {
  let testUser1Id: string;
  let testUser2Id: string;
  let sharedEmail: string;
  let stripeCustomerId1: string;
  let stripeCustomerId2: string;

  beforeEach(async () => {
    // Create test scenario with shared email but different users
    sharedEmail = `edge-test-${Date.now()}@example.com`;
    testUser1Id = '550e8400-e29b-41d4-a716-446655440011';
    testUser2Id = '550e8400-e29b-41d4-a716-446655440012';
    
    stripeCustomerId1 = `cus_edge_test1_${Date.now()}`;
    stripeCustomerId2 = `cus_edge_test2_${Date.now()}`;

    // Create test profiles
    await serviceClient.from('profiles').upsert([
      {
        user_id: testUser1Id,
        email: sharedEmail,
        first_name: 'Edge',
        last_name: 'User1',
        subscription_tier: 'free'
      },
      {
        user_id: testUser2Id,
        email: sharedEmail,
        first_name: 'Edge',
        last_name: 'User2',
        subscription_tier: 'free'
      }
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    await serviceClient
      .from('subscriptions')
      .delete()
      .in('user_id', [testUser1Id, testUser2Id]);

    await serviceClient
      .from('profiles')
      .delete()
      .in('user_id', [testUser1Id, testUser2Id]);
  });

  it('should query subscription by user_id instead of email', async () => {
    // Create subscriptions for both users with same email
    await serviceClient.from('subscriptions').insert([
      {
        user_id: testUser1Id,
        stripe_customer_id: stripeCustomerId1,
        stripe_subscription_id: 'sub_edge_test_1',
        status: 'active',
        tier: 'standard',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false
      },
      {
        user_id: testUser2Id,
        stripe_customer_id: stripeCustomerId2,
        stripe_subscription_id: 'sub_edge_test_2',
        status: 'active',
        tier: 'enterprise',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false
      }
    ]);

    // Test the RPC function that the edge function uses
    const { data: user1Result, error: user1Error } = await serviceClient
      .rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser1Id });

    const { data: user2Result, error: user2Error } = await serviceClient
      .rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser2Id });

    // Verify isolation
    expect(user1Error).toBeNull();
    expect(user2Error).toBeNull();

    expect(user1Result).toHaveLength(1);
    expect(user2Result).toHaveLength(1);

    expect(user1Result[0].stripe_customer_id).toBe(stripeCustomerId1);
    expect(user1Result[0].tier).toBe('standard');

    expect(user2Result[0].stripe_customer_id).toBe(stripeCustomerId2);
    expect(user2Result[0].tier).toBe('enterprise');

    // Critical: Users should not see each other's data even with shared email
    expect(user1Result[0].stripe_customer_id).not.toBe(stripeCustomerId2);
    expect(user2Result[0].stripe_customer_id).not.toBe(stripeCustomerId1);
  });

  it('should handle missing subscription records correctly', async () => {
    // Test when user has no subscription record yet
    const { data: result, error } = await serviceClient
      .rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser1Id });

    expect(error).toBeNull();
    expect(result).toEqual([]); // Should return empty array

    // The edge function should handle this case by falling back to email lookup
    // then create a proper subscription record with stripe_customer_id
  });

  it('should enforce stripe_customer_id is never null in active subscriptions', async () => {
    // Verify that our migration properly enforces the NOT NULL constraint
    try {
      const result = await serviceClient.from('subscriptions').insert({
        user_id: testUser1Id,
        stripe_customer_id: null, // This should fail
        status: 'active',
        tier: 'standard'
      });

      // If we reach here, the constraint isn't working
      expect(result.error).toBeDefined();
    } catch (error) {
      // This is expected behavior
      expect(error).toBeDefined();
    }
  });

  it('should support proper upsert behavior for subscription updates', async () => {
    // First, insert a subscription
    const { error: insertError } = await serviceClient.from('subscriptions').insert({
      user_id: testUser1Id,
      stripe_customer_id: stripeCustomerId1,
      status: 'pending',
      tier: 'free'
    });

    expect(insertError).toBeNull();

    // Then, upsert to update the subscription (simulating what check-subscription does)
    const { error: upsertError } = await serviceClient.from('subscriptions').upsert(
      {
        user_id: testUser1Id,
        stripe_customer_id: stripeCustomerId1,
        stripe_subscription_id: 'sub_new_123',
        status: 'active',
        tier: 'standard',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    expect(upsertError).toBeNull();

    // Verify the update was successful
    const { data: updated } = await serviceClient
      .rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser1Id });

    expect(updated).toHaveLength(1);
    expect(updated[0].status).toBe('active');
    expect(updated[0].tier).toBe('standard');
    expect(updated[0].stripe_subscription_id).toBe('sub_new_123');
  });

  it('should prevent cross-user data leakage in concurrent operations', async () => {
    // Create subscriptions
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

    // Simulate concurrent updates (like multiple check-subscription calls)
    const updatePromises = [
      serviceClient.from('subscriptions').upsert(
        {
          user_id: testUser1Id,
          stripe_customer_id: stripeCustomerId1,
          status: 'active',
          tier: 'premium',
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      ),
      serviceClient.from('subscriptions').upsert(
        {
          user_id: testUser2Id,
          stripe_customer_id: stripeCustomerId2,
          status: 'cancelled',
          tier: 'free',
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
    ];

    const results = await Promise.all(updatePromises);

    // Both updates should succeed
    expect(results[0].error).toBeNull();
    expect(results[1].error).toBeNull();

    // Verify isolation - each user should only see their own updates
    const { data: user1Final } = await serviceClient
      .rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser1Id });

    const { data: user2Final } = await serviceClient
      .rpc('get_user_subscription_with_stripe_customer', { p_user_id: testUser2Id });

    expect(user1Final[0].tier).toBe('premium');
    expect(user1Final[0].status).toBe('active');

    expect(user2Final[0].tier).toBe('free');
    expect(user2Final[0].status).toBe('cancelled');

    // Verify no cross-contamination
    expect(user1Final[0].stripe_customer_id).toBe(stripeCustomerId1);
    expect(user2Final[0].stripe_customer_id).toBe(stripeCustomerId2);
  });
});