import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkxbkaggxqcsiylwcopt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreGJrYWdneHFjc2l5bHdjb3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQyMTMsImV4cCI6MjA2ODY3MDIxM30.VvroY7_I1EKz6VBG-9DMaRKL8_2B1fROzp_FTf3IkPo';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

describe('Redeem Enrollment Edge Function Integration', () => {
  let testCourseId: string;
  let testLinkId: string;
  let testCode: string;
  let mockAuthToken: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create a test user
    testUserId = '550e8400-e29b-41d4-a716-446655440099';
    
    // Create test course
    const { data: course, error: courseError } = await serviceClient
      .from('educational_courses')
      .insert({
        title: 'Test Course for Edge Function',
        description: 'Test course for edge function integration',
        creator_id: testUserId,
        price: 100,
        is_published: true
      })
      .select()
      .single();

    if (courseError) throw courseError;
    testCourseId = course.id;

    // Create test enrollment link
    testCode = `EDGE_TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: link, error: linkError } = await serviceClient
      .from('course_enrollment_links')
      .insert({
        course_id: testCourseId,
        creator_id: testUserId,
        code: testCode,
        max_uses: 2,
        used_count: 0,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (linkError) throw linkError;
    testLinkId = link.id;

    // Create a valid auth token for testing (mock)
    mockAuthToken = 'mock-auth-token-for-testing';
  });

  afterEach(async () => {
    // Clean up test data
    if (testCourseId) {
      await serviceClient
        .from('course_enrollments')
        .delete()
        .eq('course_id', testCourseId);

      await serviceClient
        .from('course_enrollment_links')
        .delete()
        .eq('course_id', testCourseId);

      await serviceClient
        .from('educational_courses')
        .delete()
        .eq('id', testCourseId);
    }
  });

  it('should test atomic redemption function directly', async () => {
    // Test the atomic function directly
    const { data: result, error } = await serviceClient.rpc(
      'redeem_enrollment_link_atomic',
      {
        p_code: testCode,
        p_user_id: testUserId
      }
    );

    expect(error).toBeNull();
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.course_id).toBe(testCourseId);
    expect(result.already_enrolled).toBe(false);
    expect(result.used_count).toBe(1);
    expect(result.max_uses).toBe(2);

    // Verify enrollment was created
    const { data: enrollment } = await serviceClient
      .from('course_enrollments')
      .select('*')
      .eq('course_id', testCourseId)
      .eq('student_id', testUserId)
      .single();

    expect(enrollment).toBeDefined();
    expect(enrollment.payment_status).toBe('paid');
    expect(enrollment.payment_provider).toBe('bypass');
    expect(enrollment.payment_amount).toBe(0);

    // Verify link usage was incremented
    const { data: linkData } = await serviceClient
      .from('course_enrollment_links')
      .select('used_count, is_active')
      .eq('id', testLinkId)
      .single();

    expect(linkData.used_count).toBe(1);
    expect(linkData.is_active).toBe(true); // Still active since max_uses is 2
  });

  it('should test concurrent atomic redemptions', async () => {
    const userId1 = '550e8400-e29b-41d4-a716-446655440101';
    const userId2 = '550e8400-e29b-41d4-a716-446655440102';
    const userId3 = '550e8400-e29b-41d4-a716-446655440103';

    // Set link to max_uses = 1 for this test
    await serviceClient
      .from('course_enrollment_links')
      .update({ max_uses: 1 })
      .eq('id', testLinkId);

    // Simulate concurrent redemptions
    const promises = [
      serviceClient.rpc('redeem_enrollment_link_atomic', {
        p_code: testCode,
        p_user_id: userId1
      }),
      serviceClient.rpc('redeem_enrollment_link_atomic', {
        p_code: testCode,
        p_user_id: userId2
      }),
      serviceClient.rpc('redeem_enrollment_link_atomic', {
        p_code: testCode,
        p_user_id: userId3
      })
    ];

    const results = await Promise.all(promises);
    
    // Check that only one succeeded
    const successCount = results.filter(r => r.data?.success === true).length;
    const failureCount = results.filter(r => r.data?.success === false).length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(2);

    // Verify final state
    const { data: finalLink } = await serviceClient
      .from('course_enrollment_links')
      .select('used_count, is_active')
      .eq('id', testLinkId)
      .single();

    expect(finalLink.used_count).toBe(1);
    expect(finalLink.is_active).toBe(false); // Should be inactive after reaching max

    // Verify only one enrollment was created
    const { data: enrollments } = await serviceClient
      .from('course_enrollments')
      .select('student_id')
      .eq('course_id', testCourseId);

    expect(enrollments).toHaveLength(1);
  });

  it('should test error cases', async () => {
    // Test invalid code
    const { data: invalidResult } = await serviceClient.rpc(
      'redeem_enrollment_link_atomic',
      {
        p_code: 'INVALID_CODE_123',
        p_user_id: testUserId
      }
    );

    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toBe('Invalid code');

    // Test expired link
    await serviceClient
      .from('course_enrollment_links')
      .update({ 
        expires_at: new Date(Date.now() - 60 * 1000).toISOString()
      })
      .eq('id', testLinkId);

    const { data: expiredResult } = await serviceClient.rpc(
      'redeem_enrollment_link_atomic',
      {
        p_code: testCode,
        p_user_id: testUserId
      }
    );

    expect(expiredResult.success).toBe(false);
    expect(expiredResult.error).toBe('Link expired');

    // Test inactive link
    await serviceClient
      .from('course_enrollment_links')
      .update({ 
        is_active: false,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', testLinkId);

    const { data: inactiveResult } = await serviceClient.rpc(
      'redeem_enrollment_link_atomic',
      {
        p_code: testCode,
        p_user_id: testUserId
      }
    );

    expect(inactiveResult.success).toBe(false);
    expect(inactiveResult.error).toBe('Link is inactive');
  });
});