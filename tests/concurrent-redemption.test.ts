import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkxbkaggxqcsiylwcopt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('Concurrent Enrollment Redemption', () => {
  let testCourseId: string;
  let testLinkId: string;
  let testCode: string;
  let testUserId1: string;
  let testUserId2: string;
  let testUserId3: string;

  beforeEach(async () => {
    // Create test course
    const { data: course, error: courseError } = await supabase
      .from('educational_courses')
      .insert({
        title: 'Test Course for Concurrent Redemption',
        description: 'Test course',
        creator_id: '550e8400-e29b-41d4-a716-446655440000',
        price: 100,
        is_published: true
      })
      .select()
      .single();

    if (courseError) throw courseError;
    testCourseId = course.id;

    // Create test enrollment link with max_uses = 1
    testCode = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: link, error: linkError } = await supabase
      .from('course_enrollment_links')
      .insert({
        course_id: testCourseId,
        creator_id: '550e8400-e29b-41d4-a716-446655440000',
        code: testCode,
        max_uses: 1,
        used_count: 0,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      })
      .select()
      .single();

    if (linkError) throw linkError;
    testLinkId = link.id;

    // Generate test user IDs
    testUserId1 = '550e8400-e29b-41d4-a716-446655440001';
    testUserId2 = '550e8400-e29b-41d4-a716-446655440002';
    testUserId3 = '550e8400-e29b-41d4-a716-446655440003';
  });

  afterEach(async () => {
    // Clean up test data
    if (testCourseId) {
      await supabase
        .from('course_enrollments')
        .delete()
        .eq('course_id', testCourseId);

      await supabase
        .from('course_enrollment_links')
        .delete()
        .eq('course_id', testCourseId);

      await supabase
        .from('educational_courses')
        .delete()
        .eq('id', testCourseId);
    }
  });

  it('should handle concurrent redemptions correctly - only one should succeed', async () => {
    // Simulate three concurrent redemption attempts
    const redemptionPromises = [
      supabase.rpc('redeem_enrollment_link_atomic', {
        p_code: testCode,
        p_user_id: testUserId1
      }),
      supabase.rpc('redeem_enrollment_link_atomic', {
        p_code: testCode,
        p_user_id: testUserId2
      }),
      supabase.rpc('redeem_enrollment_link_atomic', {
        p_code: testCode,
        p_user_id: testUserId3
      })
    ];

    const results = await Promise.all(redemptionPromises);

    // Count successful redemptions
    const successfulRedemptions = results.filter(
      result => result.data?.success === true
    );

    const failedRedemptions = results.filter(
      result => result.data?.success === false
    );

    // Only one redemption should succeed
    expect(successfulRedemptions).toHaveLength(1);
    expect(failedRedemptions).toHaveLength(2);

    // The successful redemption should have correct data
    const successResult = successfulRedemptions[0].data;
    expect(successResult.course_id).toBe(testCourseId);
    expect(successResult.used_count).toBe(1);
    expect(successResult.max_uses).toBe(1);

    // Failed redemptions should have appropriate error messages
    failedRedemptions.forEach(result => {
      expect(result.data.error).toMatch(/Usage limit reached|Usage limit would be exceeded/);
    });

    // Verify the link is now inactive
    const { data: linkData } = await supabase
      .from('course_enrollment_links')
      .select('used_count, is_active')
      .eq('id', testLinkId)
      .single();

    expect(linkData.used_count).toBe(1);
    expect(linkData.is_active).toBe(false);

    // Verify only one enrollment was created
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('student_id')
      .eq('course_id', testCourseId);

    expect(enrollments).toHaveLength(1);
  });

  it('should handle concurrent redemptions for multi-use link correctly', async () => {
    // Update link to allow 2 uses
    await supabase
      .from('course_enrollment_links')
      .update({ max_uses: 2 })
      .eq('id', testLinkId);

    // Simulate three concurrent redemption attempts
    const redemptionPromises = [
      supabase.rpc('redeem_enrollment_link_atomic', {
        p_code: testCode,
        p_user_id: testUserId1
      }),
      supabase.rpc('redeem_enrollment_link_atomic', {
        p_code: testCode,
        p_user_id: testUserId2
      }),
      supabase.rpc('redeem_enrollment_link_atomic', {
        p_code: testCode,
        p_user_id: testUserId3
      })
    ];

    const results = await Promise.all(redemptionPromises);

    // Count successful redemptions
    const successfulRedemptions = results.filter(
      result => result.data?.success === true
    );

    const failedRedemptions = results.filter(
      result => result.data?.success === false
    );

    // Two redemptions should succeed, one should fail
    expect(successfulRedemptions).toHaveLength(2);
    expect(failedRedemptions).toHaveLength(1);

    // Verify the link is now inactive after reaching max uses
    const { data: linkData } = await supabase
      .from('course_enrollment_links')
      .select('used_count, is_active')
      .eq('id', testLinkId)
      .single();

    expect(linkData.used_count).toBe(2);
    expect(linkData.is_active).toBe(false);

    // Verify two enrollments were created
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('student_id')
      .eq('course_id', testCourseId);

    expect(enrollments).toHaveLength(2);
  });

  it('should prevent redemption when link is expired', async () => {
    // Update link to be expired
    await supabase
      .from('course_enrollment_links')
      .update({ 
        expires_at: new Date(Date.now() - 60 * 1000).toISOString() // 1 minute ago
      })
      .eq('id', testLinkId);

    const { data: result } = await supabase.rpc('redeem_enrollment_link_atomic', {
      p_code: testCode,
      p_user_id: testUserId1
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Link expired');
  });

  it('should prevent redemption when link is inactive', async () => {
    // Update link to be inactive
    await supabase
      .from('course_enrollment_links')
      .update({ is_active: false })
      .eq('id', testLinkId);

    const { data: result } = await supabase.rpc('redeem_enrollment_link_atomic', {
      p_code: testCode,
      p_user_id: testUserId1
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Link is inactive');
  });

  it('should handle duplicate redemption by same user gracefully', async () => {
    // First redemption should succeed
    const { data: result1 } = await supabase.rpc('redeem_enrollment_link_atomic', {
      p_code: testCode,
      p_user_id: testUserId1
    });

    expect(result1.success).toBe(true);
    expect(result1.already_enrolled).toBe(false);

    // Update link to allow more uses
    await supabase
      .from('course_enrollment_links')
      .update({ 
        max_uses: 5,
        is_active: true 
      })
      .eq('id', testLinkId);

    // Second redemption by same user should succeed but not create duplicate enrollment
    const { data: result2 } = await supabase.rpc('redeem_enrollment_link_atomic', {
      p_code: testCode,
      p_user_id: testUserId1
    });

    expect(result2.success).toBe(true);
    expect(result2.already_enrolled).toBe(true);

    // Verify only one enrollment exists for this user
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', testCourseId)
      .eq('student_id', testUserId1);

    expect(enrollments).toHaveLength(1);

    // Verify used_count increased by 2 (one for each call)
    const { data: linkData } = await supabase
      .from('course_enrollment_links')
      .select('used_count')
      .eq('id', testLinkId)
      .single();

    expect(linkData.used_count).toBe(2);
  });
});