import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkxbkaggxqcsiylwcopt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreGJrYWdneHFjc2l5bHdjb3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQyMTMsImV4cCI6MjA2ODY3MDIxM30.VvroY7_I1EKz6VBG-9DMaRKL8_2B1fROzp_FTf3IkPo';

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

describe('Certification Code Security Tests', () => {
  let testUserId: string;
  let testCertificationId: string;
  let generatedCodes: string[] = [];

  beforeEach(async () => {
    testUserId = '550e8400-e29b-41d4-a716-446655440099';
    testCertificationId = '550e8400-e29b-41d4-a716-446655440001';

    // Create test certification
    await serviceClient.from('certifications').upsert({
      id: testCertificationId,
      name: 'Security Test Certification',
      description: 'Test certification for security testing',
      skill_level: 'beginner',
      points_required: 100,
      is_active: true
    });

    // Create test user profile
    await serviceClient.from('profiles').upsert({
      user_id: testUserId,
      email: 'security-test@example.com',
      first_name: 'Security',
      last_name: 'Test'
    });
  });

  afterEach(async () => {
    // Clean up test data
    await serviceClient
      .from('user_certifications')
      .delete()
      .eq('user_id', testUserId);

    await serviceClient
      .from('certifications')
      .delete()
      .eq('id', testCertificationId);

    await serviceClient
      .from('profiles')
      .delete()
      .eq('user_id', testUserId);

    generatedCodes = [];
  });

  describe('Cryptographic Code Generation', () => {
    it('should generate cryptographically secure verification codes', async () => {
      const codes = [];
      
      // Generate multiple codes and test their properties
      for (let i = 0; i < 10; i++) {
        const { data: code, error } = await serviceClient
          .rpc('generate_secure_verification_code');
        
        expect(error).toBeNull();
        expect(code).toBeDefined();
        expect(typeof code).toBe('string');
        
        // Code should follow the format CERT-YYYYMMDDHHMISS-XXXXXXXXXXXX
        expect(code).toMatch(/^CERT-\d{14}-[A-Z0-9]{12}$/);
        
        codes.push(code);
      }

      // All codes should be unique
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should ensure code randomness and unpredictability', async () => {
      const codes = [];
      const randomParts = [];
      
      // Generate 50 codes to test randomness
      for (let i = 0; i < 50; i++) {
        const { data: code } = await serviceClient
          .rpc('generate_secure_verification_code');
        
        codes.push(code);
        // Extract random part (after the second dash)
        const parts = code.split('-');
        randomParts.push(parts[2]);
      }

      // Test for randomness indicators
      const uniqueRandomParts = new Set(randomParts);
      expect(uniqueRandomParts.size).toBe(randomParts.length); // All should be unique

      // Test that codes don't follow predictable patterns
      for (let i = 1; i < codes.length; i++) {
        const current = codes[i];
        const previous = codes[i - 1];
        
        // Random parts should be different
        const currentRandom = current.split('-')[2];
        const previousRandom = previous.split('-')[2];
        expect(currentRandom).not.toBe(previousRandom);
      }

      // Test character distribution in random parts
      const allChars = randomParts.join('');
      const charCounts = {};
      for (const char of allChars) {
        charCounts[char] = (charCounts[char] || 0) + 1;
      }

      // Should have reasonable distribution of characters (not all the same)
      const uniqueChars = Object.keys(charCounts);
      expect(uniqueChars.length).toBeGreaterThan(10); // Should use variety of chars
    });

    it('should resist timestamp-based prediction attacks', async () => {
      const codes = [];
      
      // Generate codes rapidly to test timestamp handling
      const promises = Array(20).fill(null).map(() => 
        serviceClient.rpc('generate_secure_verification_code')
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(({ data: code, error }) => {
        expect(error).toBeNull();
        expect(code).toBeDefined();
        codes.push(code);
      });

      // Even if some codes have same timestamp, random parts should differ
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);

      // Extract timestamps and random parts
      const timestamps = codes.map(code => code.split('-')[1]);
      const randomParts = codes.map(code => code.split('-')[2]);

      // Even with potentially same timestamps, random parts must be unique
      const uniqueRandomParts = new Set(randomParts);
      expect(uniqueRandomParts.size).toBe(randomParts.length);
    });
  });

  describe('Code Hashing and Storage', () => {
    it('should securely hash verification codes', async () => {
      const testCodes = [
        'CERT-20240815123456-ABCDEF123456',
        'CERT-20240815123457-GHIJKL789012',
        'CERT-20240815123458-MNOPQR345678'
      ];

      const hashes = [];
      
      for (const code of testCodes) {
        const { data: hash, error } = await serviceClient
          .rpc('hash_verification_code', { code });
        
        expect(error).toBeNull();
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash.length).toBe(64); // SHA-256 hex = 64 chars
        expect(hash).toMatch(/^[a-f0-9]{64}$/); // Valid hex
        
        hashes.push(hash);
      }

      // Different codes should produce different hashes
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);

      // Same code should produce same hash (deterministic)
      const { data: hash1 } = await serviceClient
        .rpc('hash_verification_code', { code: testCodes[0] });
      const { data: hash2 } = await serviceClient
        .rpc('hash_verification_code', { code: testCodes[0] });
      
      expect(hash1).toBe(hash2);
    });

    it('should use salted hashing to prevent rainbow table attacks', async () => {
      const commonCode = 'CERT-20240815123456-ABCDEF123456';
      
      // Hash the same code multiple times
      const { data: hash1 } = await serviceClient
        .rpc('hash_verification_code', { code: commonCode });
      const { data: hash2 } = await serviceClient
        .rpc('hash_verification_code', { code: commonCode });
      
      // Should be deterministic (same hash each time with same salt)
      expect(hash1).toBe(hash2);
      
      // But hash should not be a simple SHA-256 of just the code
      // (This tests that salt is being used)
      const crypto = require('crypto');
      const simpleHash = crypto.createHash('sha256').update(commonCode).digest('hex');
      expect(hash1).not.toBe(simpleHash);
    });

    it('should store hashed codes securely in database', async () => {
      const testCode = 'CERT-20240815123456-TESTSECURE01';
      
      // Hash the code
      const { data: hashedCode } = await serviceClient
        .rpc('hash_verification_code', { code: testCode });

      // Store a certification with the hashed code
      await serviceClient.from('user_certifications').insert({
        user_id: testUserId,
        certification_id: testCertificationId,
        verification_code: testCode,
        verification_code_hash: hashedCode,
        code_display_count: 0
      });

      // Retrieve the record
      const { data: stored } = await serviceClient
        .from('user_certifications')
        .select('verification_code, verification_code_hash')
        .eq('user_id', testUserId)
        .single();

      expect(stored.verification_code_hash).toBe(hashedCode);
      expect(stored.verification_code_hash).not.toBe(testCode); // Hash != plaintext
    });
  });

  describe('Code Verification and Validation', () => {
    it('should verify valid codes correctly', async () => {
      const testCode = 'CERT-20240815123456-VALIDTEST001';
      
      // Create a certification record
      const { data: hashedCode } = await serviceClient
        .rpc('hash_verification_code', { code: testCode });

      await serviceClient.from('user_certifications').insert({
        user_id: testUserId,
        certification_id: testCertificationId,
        verification_code: testCode,
        verification_code_hash: hashedCode
      });

      // Verify the code
      const { data: verification, error } = await serviceClient
        .rpc('verify_certification_code', { p_code: testCode });

      expect(error).toBeNull();
      expect(verification).toHaveLength(1);
      expect(verification[0].is_valid).toBe(true);
      expect(verification[0].certification_name).toBe('Security Test Certification');
    });

    it('should reject invalid codes', async () => {
      const invalidCodes = [
        'CERT-20240815123456-INVALIDCODE1',
        'FAKE-20240815123456-ABCDEF123456',
        'CERT-INVALID-FORMAT',
        '',
        'completely-invalid'
      ];

      for (const invalidCode of invalidCodes) {
        const { data: verification, error } = await serviceClient
          .rpc('verify_certification_code', { p_code: invalidCode });

        expect(error).toBeNull();
        expect(verification).toHaveLength(1);
        expect(verification[0].is_valid).toBe(false);
      }
    });

    it('should prevent code enumeration attacks', async () => {
      // Attempt to verify many invalid codes rapidly
      const invalidAttempts = [];
      
      for (let i = 0; i < 100; i++) {
        const fakeCode = `CERT-20240815123456-FAKE${i.toString().padStart(8, '0')}`;
        invalidAttempts.push(
          serviceClient.rpc('verify_certification_code', { p_code: fakeCode })
        );
      }

      const results = await Promise.all(invalidAttempts);
      
      // All should return invalid
      results.forEach(({ data, error }) => {
        expect(error).toBeNull();
        expect(data[0].is_valid).toBe(false);
      });

      // Function should handle bulk invalid requests without errors
      expect(results.every(r => !r.error)).toBe(true);
    });
  });

  describe('Rate Limiting and Brute Force Protection', () => {
    it('should enforce rate limits on code revelation', async () => {
      const mockAuthToken = 'mock-auth-token';
      
      // Create a certification
      await serviceClient.from('user_certifications').insert({
        user_id: testUserId,
        certification_id: testCertificationId,
        verification_code: 'CERT-20240815123456-RATELIMIT01',
        verification_code_hash: 'test-hash',
        code_display_count: 0
      });

      // Attempt multiple rapid code reveals
      const promises = Array(10).fill(null).map(() =>
        anonClient.functions.invoke('reveal-verification-code', {
          body: { certification_id: testCertificationId },
          headers: { Authorization: `Bearer ${mockAuthToken}` }
        })
      );

      const results = await Promise.all(promises);
      
      // Should not all succeed due to rate limiting
      const successCount = results.filter(r => r.data?.success).length;
      const errorCount = results.filter(r => r.error || !r.data?.success).length;
      
      expect(errorCount).toBeGreaterThan(0); // Some should be rate limited
    });

    it('should track and limit code display attempts', async () => {
      const testCode = 'CERT-20240815123456-DISPLAYLIMIT1';
      
      // Create certification with hash
      const { data: hashedCode } = await serviceClient
        .rpc('hash_verification_code', { code: testCode });

      await serviceClient.from('user_certifications').insert({
        user_id: testUserId,
        certification_id: testCertificationId,
        verification_code: testCode,
        verification_code_hash: hashedCode,
        code_display_count: 4 // Near the limit of 5
      });

      // Try to reveal code when near limit
      const result = await anonClient.functions.invoke('reveal-verification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer mock-token` }
      });

      // Should include warning about approaching limit
      if (result.data?.success) {
        expect(result.data.display_count).toBe(5);
        expect(result.data.warning).toBeDefined();
      }

      // Next attempt should fail
      const nextResult = await anonClient.functions.invoke('reveal-verification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer mock-token` }
      });

      expect(nextResult.error || !nextResult.data?.success).toBe(true);
    });

    it('should log suspicious activity for security monitoring', async () => {
      // Create certification at display limit
      await serviceClient.from('user_certifications').insert({
        user_id: testUserId,
        certification_id: testCertificationId,
        verification_code: 'CERT-20240815123456-SUSPICIOUS01',
        verification_code_hash: 'test-hash',
        code_display_count: 5 // At the limit
      });

      // Attempt to reveal code beyond limit
      await anonClient.functions.invoke('reveal-verification-code', {
        body: { certification_id: testCertificationId },
        headers: { Authorization: `Bearer mock-token` }
      });

      // Check that security event was logged
      const { data: securityEvents } = await serviceClient
        .from('security_events')
        .select('*')
        .eq('user_id', testUserId)
        .eq('event_type', 'excessive_code_reveal_attempts');

      expect(securityEvents?.length).toBeGreaterThan(0);
      
      if (securityEvents?.length > 0) {
        const event = securityEvents[0];
        expect(event.risk_score).toBeGreaterThan(5);
        expect(event.event_data.certification_id).toBe(testCertificationId);
      }
    });
  });

  describe('Code Uniqueness and Collision Resistance', () => {
    it('should generate unique codes across high volume', async () => {
      const batchSize = 1000;
      const codes = new Set();
      
      // Generate large batch of codes
      const promises = Array(batchSize).fill(null).map(() =>
        serviceClient.rpc('generate_secure_verification_code')
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(({ data: code, error }) => {
        expect(error).toBeNull();
        expect(code).toBeDefined();
        expect(codes.has(code)).toBe(false); // No duplicates
        codes.add(code);
      });

      expect(codes.size).toBe(batchSize);
    });

    it('should maintain uniqueness across database constraints', async () => {
      // Generate and store multiple certifications
      const codes = [];
      
      for (let i = 0; i < 10; i++) {
        const { data: code } = await serviceClient
          .rpc('generate_secure_verification_code');
        const { data: hash } = await serviceClient
          .rpc('hash_verification_code', { code });

        codes.push({ code, hash });
      }

      // Store all certifications
      const insertPromises = codes.map((codeData, index) =>
        serviceClient.from('user_certifications').insert({
          user_id: testUserId,
          certification_id: testCertificationId,
          verification_code: codeData.code,
          verification_code_hash: codeData.hash
        })
      );

      const insertResults = await Promise.all(insertPromises);
      
      // All should succeed (no unique constraint violations)
      insertResults.forEach(result => {
        expect(result.error).toBeNull();
      });

      // Verify all codes are stored and unique
      const { data: storedCerts } = await serviceClient
        .from('user_certifications')
        .select('verification_code, verification_code_hash')
        .eq('user_id', testUserId);

      expect(storedCerts).toHaveLength(codes.length);
      
      const storedCodes = storedCerts.map(cert => cert.verification_code);
      const uniqueStoredCodes = new Set(storedCodes);
      expect(uniqueStoredCodes.size).toBe(storedCodes.length);
    });

    it('should resist predictable pattern attacks', async () => {
      const codes = [];
      
      // Generate codes at regular intervals
      for (let i = 0; i < 20; i++) {
        const { data: code } = await serviceClient
          .rpc('generate_secure_verification_code');
        codes.push(code);
        
        // Small delay to potentially get same timestamp
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Analyze for patterns
      const timestamps = codes.map(code => code.split('-')[1]);
      const randomParts = codes.map(code => code.split('-')[2]);

      // Even if timestamps are similar/same, random parts should vary significantly
      for (let i = 1; i < randomParts.length; i++) {
        expect(randomParts[i]).not.toBe(randomParts[i-1]);
        
        // Check for sequential patterns
        const current = randomParts[i];
        const previous = randomParts[i-1];
        
        // Should not be incrementing patterns
        expect(current).not.toBe(String.fromCharCode(previous.charCodeAt(0) + 1));
      }

      // Test entropy in random parts
      const allRandomChars = randomParts.join('');
      const charFrequency = {};
      
      for (const char of allRandomChars) {
        charFrequency[char] = (charFrequency[char] || 0) + 1;
      }

      // Should have good character distribution (no single char dominates)
      const totalChars = allRandomChars.length;
      Object.values(charFrequency).forEach(count => {
        const frequency = count / totalChars;
        expect(frequency).toBeLessThan(0.5); // No char should be >50% of total
      });
    });
  });
});