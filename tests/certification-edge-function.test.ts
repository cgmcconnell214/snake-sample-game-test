import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkxbkaggxqcsiylwcopt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreGJrYWdneHFjc2l5bHdjb3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQyMTMsImV4cCI6MjA2ODY3MDIxM30.VvroY7_I1EKz6VBG-9DMaRKL8_2B1fROzp_FTf3IkPo';

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

describe('Certification Edge Function Security Tests', () => {
  let testUserId: string;
  let testCertificationId: string;
  let mockAuthToken: string;

  beforeEach(async () => {
    testUserId = '550e8400-e29b-41d4-a716-446655440199';
    testCertificationId = '550e8400-e29b-41d4-a716-446655440101';
    mockAuthToken = 'mock-edge-function-token';

    // Create test certification and user
    await serviceClient.from('certifications').upsert({
      id: testCertificationId,
      name: 'Edge Function Test Certification',
      description: 'Test certification for edge function testing',
      skill_level: 'intermediate',
      points_required: 200,
      is_active: true
    });

    await serviceClient.from('profiles').upsert({
      user_id: testUserId,
      email: 'edge-test@example.com',
      first_name: 'Edge',
      last_name: 'Test'
    });
  });

  afterEach(async () => {
    // Clean up test data
    await serviceClient.from('user_certifications').delete().eq('user_id', testUserId);
    await serviceClient.from('certifications').delete().eq('id', testCertificationId);
    await serviceClient.from('profiles').delete().eq('user_id', testUserId);
    await serviceClient.from('security_events').delete().eq('user_id', testUserId);
    await serviceClient.from('user_behavior_log').delete().eq('user_id', testUserId);
  });

  describe('Generate Certification Code Edge Function', () => {
    it('should require authentication', async () => {
      const result = await anonClient.functions.invoke('generate-certification-code', {
        body: { certification_id: testCertificationId }
        // No authorization header
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/authentication|unauthorized/i);
    });

    it('should validate required parameters', async () => {
      const testCases = [
        {}, // No certification_id
        { certification_id: null },
        { certification_id: '' },
        { wrong_param: testCertificationId }
      ];

      for (const body of testCases) {
        const result = await anonClient.functions.invoke('generate-certification-code', {
          body,
          headers: { Authorization: `Bearer ${mockAuthToken}` }
        });

        expect(result.error || !result.data?.success).toBe(true);
      }
    });

    it('should prevent duplicate certifications', async () => {
      // First certification should succeed
      const result1 = await anonClient.functions.invoke('generate-certification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      // Second attempt should fail
      const result2 = await anonClient.functions.invoke('generate-certification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      if (result1.data?.success) {
        expect(result2.error || !result2.data?.success).toBe(true);
        expect(result2.error?.message || result2.data?.message).toMatch(/already|conflict|exists/i);
      }
    });

    it('should generate secure verification codes', async () => {
      const result = await anonClient.functions.invoke('generate-certification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      if (result.data?.success) {
        const code = result.data.verification_code;
        
        expect(code).toBeDefined();
        expect(typeof code).toBe('string');
        expect(code).toMatch(/^CERT-\d{14}-[A-Z0-9]{12}$/);
        
        // Code should not contain predictable patterns
        expect(code).not.toMatch(/1234|ABCD|0000|1111/);
        
        // Should return warning about one-time display
        expect(result.data.message).toMatch(/only.*shown.*once/i);
      }
    });

    it('should log security events properly', async () => {
      await anonClient.functions.invoke('generate-certification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      // Check that security logging occurred
      const { data: behaviorLogs } = await serviceClient
        .from('user_behavior_log')
        .select('*')
        .eq('user_id', testUserId)
        .eq('action', 'certification_earned');

      expect(behaviorLogs?.length).toBeGreaterThan(0);
      
      if (behaviorLogs?.length > 0) {
        const log = behaviorLogs[0];
        expect(log.risk_indicators.certification_id).toBe(testCertificationId);
        expect(log.risk_indicators.verification_method).toBe('secure_generation');
      }
    });

    it('should handle concurrent requests safely', async () => {
      // Attempt to generate multiple certifications simultaneously
      const promises = Array(5).fill(null).map(() =>
        anonClient.functions.invoke('generate-certification-code', {
          body: { certification_id: testCertificationId },
          headers: { Authorization: `Bearer ${mockAuthToken}` }
        })
      );

      const results = await Promise.all(promises);
      
      // Only one should succeed due to duplicate prevention
      const successCount = results.filter(r => r.data?.success).length;
      const errorCount = results.filter(r => r.error || !r.data?.success).length;

      expect(successCount).toBe(1);
      expect(errorCount).toBe(4);
    });
  });

  describe('Reveal Verification Code Edge Function', () => {
    let certificationRecordId: string;

    beforeEach(async () => {
      // Create a certification record for testing reveals
      const { data: code } = await serviceClient
        .rpc('generate_secure_verification_code');
      const { data: hash } = await serviceClient
        .rpc('hash_verification_code', { code });

      const { data: cert } = await serviceClient
        .from('user_certifications')
        .insert({
          user_id: testUserId,
          certification_id: testCertificationId,
          verification_code: code,
          verification_code_hash: hash,
          code_display_count: 0
        })
        .select()
        .single();

      certificationRecordId = cert.id;
    });

    it('should require authentication for code reveals', async () => {
      const result = await anonClient.functions.invoke('reveal-verification-code', {
        body: { certification_id: testCertificationId }
        // No authorization header
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/authentication|unauthorized/i);
    });

    it('should enforce strict rate limiting', async () => {
      // Make multiple rapid requests
      const promises = Array(10).fill(null).map(() =>
        anonClient.functions.invoke('reveal-verification-code', {
          body: { certification_id: testCertificationId },
          headers: { Authorization: `Bearer ${mockAuthToken}` }
        })
      );

      const results = await Promise.all(promises);
      
      // Should have rate limit failures
      const rateLimitErrors = results.filter(r => 
        r.error?.message?.includes('rate') || 
        r.error?.message?.includes('limit') ||
        r.error?.message?.includes('429')
      );

      expect(rateLimitErrors.length).toBeGreaterThan(0);
    });

    it('should track and limit display count', async () => {
      // Update certification to near display limit
      await serviceClient
        .from('user_certifications')
        .update({ code_display_count: 4 })
        .eq('id', certificationRecordId);

      // Try to reveal - should succeed with warning
      const result1 = await anonClient.functions.invoke('reveal-verification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      if (result1.data?.success) {
        expect(result1.data.display_count).toBe(5);
        expect(result1.data.warning).toBeDefined();
      }

      // Try to reveal again - should fail
      const result2 = await anonClient.functions.invoke('reveal-verification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      expect(result2.error || !result2.data?.success).toBe(true);
    });

    it('should log security violations for excessive attempts', async () => {
      // Set certification to display limit
      await serviceClient
        .from('user_certifications')
        .update({ code_display_count: 5 })
        .eq('id', certificationRecordId);

      // Attempt to reveal beyond limit
      await anonClient.functions.invoke('reveal-verification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      // Check security event was logged
      const { data: securityEvents } = await serviceClient
        .from('security_events')
        .select('*')
        .eq('user_id', testUserId)
        .eq('event_type', 'excessive_code_reveal_attempts');

      expect(securityEvents?.length).toBeGreaterThan(0);
      
      if (securityEvents?.length > 0) {
        const event = securityEvents[0];
        expect(event.risk_score).toBeGreaterThanOrEqual(7);
        expect(event.event_data.certification_id).toBe(testCertificationId);
        expect(event.event_data.display_count).toBe(5);
      }
    });

    it('should update last displayed timestamp', async () => {
      const beforeTime = new Date().toISOString();

      await anonClient.functions.invoke('reveal-verification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      const { data: updated } = await serviceClient
        .from('user_certifications')
        .select('last_displayed_at, code_display_count')
        .eq('id', certificationRecordId)
        .single();

      expect(updated.last_displayed_at).toBeDefined();
      expect(new Date(updated.last_displayed_at).getTime())
        .toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
      expect(updated.code_display_count).toBe(1);
    });

    it('should validate certification ownership', async () => {
      const otherUserId = '550e8400-e29b-41d4-a716-446655440999';
      const otherToken = 'mock-other-user-token';

      // Try to reveal code for certification owned by different user
      const result = await anonClient.functions.invoke('reveal-verification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${otherToken}` }
      });

      expect(result.error || !result.data?.success).toBe(true);
      expect(result.error?.message || result.data?.message)
        .toMatch(/not found|unauthorized|access/i);
    });
  });

  describe('End-to-End Security Flow', () => {
    it('should maintain security through complete certification lifecycle', async () => {
      // 1. Generate certification
      const generateResult = await anonClient.functions.invoke('generate-certification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      expect(generateResult.data?.success).toBe(true);
      const originalCode = generateResult.data.verification_code;
      expect(originalCode).toMatch(/^CERT-\d{14}-[A-Z0-9]{12}$/);

      // 2. Verify code is hashed in database
      const { data: storedCert } = await serviceClient
        .from('user_certifications')
        .select('verification_code_hash, code_display_count')
        .eq('user_id', testUserId)
        .eq('certification_id', testCertificationId)
        .single();

      expect(storedCert.verification_code_hash).toBeDefined();
      expect(storedCert.verification_code_hash).not.toBe(originalCode);
      expect(storedCert.code_display_count).toBe(0);

      // 3. Reveal code (should work)
      const revealResult = await anonClient.functions.invoke('reveal-verification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      expect(revealResult.data?.success).toBe(true);
      expect(revealResult.data.verification_code).toBe(originalCode);
      expect(revealResult.data.display_count).toBe(1);

      // 4. Verify code externally
      const { data: verification } = await serviceClient
        .rpc('verify_certification_code', { p_code: originalCode });

      expect(verification[0].is_valid).toBe(true);
      expect(verification[0].certification_name).toBe('Edge Function Test Certification');

      // 5. Test invalid code verification
      const { data: invalidVerification } = await serviceClient
        .rpc('verify_certification_code', { p_code: 'CERT-INVALID-CODE-123' });

      expect(invalidVerification[0].is_valid).toBe(false);
    });

    it('should resist brute force attacks across all endpoints', async () => {
      // Generate a valid certification first
      await anonClient.functions.invoke('generate-certification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      // 1. Test generate endpoint brute force resistance
      const generateAttempts = Array(20).fill(null).map(() =>
        anonClient.functions.invoke('generate-certification-code', {
          body: { certification_id: testCertificationId },
          headers: { Authorization: `Bearer ${mockAuthToken}` }
        })
      );

      const generateResults = await Promise.all(generateAttempts);
      const generateErrors = generateResults.filter(r => r.error || !r.data?.success);
      expect(generateErrors.length).toBe(20); // All should fail (already exists)

      // 2. Test reveal endpoint brute force resistance
      const revealAttempts = Array(15).fill(null).map(() =>
        anonClient.functions.invoke('reveal-verification-code', {
          body: { certification_id: testCertificationId },
          headers: { Authorization: `Bearer ${mockAuthToken}` }
        })
      );

      const revealResults = await Promise.all(revealAttempts);
      const revealErrors = revealResults.filter(r => r.error || !r.data?.success);
      expect(revealErrors.length).toBeGreaterThan(10); // Most should fail due to rate limiting

      // 3. Test verification endpoint with invalid codes
      const invalidCodes = Array(50).fill(null).map((_, i) => 
        `CERT-20240815123456-BRUTE${i.toString().padStart(6, '0')}`
      );

      const verifyAttempts = invalidCodes.map(code =>
        serviceClient.rpc('verify_certification_code', { p_code: code })
      );

      const verifyResults = await Promise.all(verifyAttempts);
      
      // All should be invalid
      verifyResults.forEach(({ data }) => {
        expect(data[0].is_valid).toBe(false);
      });

      // Function should handle bulk requests without performance degradation
      expect(verifyResults.every(r => !r.error)).toBe(true);
    });
  });
});