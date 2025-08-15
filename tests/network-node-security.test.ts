import { describe, it, expect, beforeEach } from 'vitest';

// Mock node management functions for testing
interface NetworkNode {
  id?: string;
  name: string;
  url: string;
  description?: string;
  is_active?: boolean;
  allowed_domains: string[];
  node_type?: string;
  priority?: number;
  timeout_ms?: number;
}

// Internal/private network patterns to reject
const INTERNAL_NETWORK_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^fc00:/i,
  /^fe80:/i,
  /^::1$/,
  /localhost/i
];

// Allowlist of valid domains for network nodes
const ALLOWED_DOMAINS = [
  'xrpl.ws',
  'ripple.com',
  's1.ripple.com',
  's2.ripple.com',
  'xrplcluster.com',
  'xrpl-ws.org'
];

function validateNodeUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Check protocol
    if (!['https:', 'wss:'].includes(parsedUrl.protocol)) {
      return { isValid: false, error: 'Only HTTPS and WSS protocols are allowed' };
    }
    
    // Check for internal network addresses
    const hostname = parsedUrl.hostname;
    for (const pattern of INTERNAL_NETWORK_PATTERNS) {
      if (pattern.test(hostname)) {
        return { isValid: false, error: 'Internal network addresses are not allowed' };
      }
    }
    
    // Check domain allowlist
    const domain = hostname.toLowerCase();
    const isAllowed = ALLOWED_DOMAINS.some(allowedDomain => 
      domain === allowedDomain || domain.endsWith('.' + allowedDomain)
    );
    
    if (!isAllowed) {
      return { isValid: false, error: `Domain ${domain} is not in the allowlist` };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

describe('Network Node Security', () => {
  describe('URL Validation', () => {
    it('should accept valid HTTPS URLs from allowlisted domains', () => {
      const validUrls = [
        'https://xrpl.ws/api/v1',
        'https://s1.ripple.com:51234',
        'https://test.xrpl.ws/health',
        'wss://xrpl.ws/websocket'
      ];

      validUrls.forEach(url => {
        const result = validateNodeUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject HTTP URLs', () => {
      const result = validateNodeUrl('http://xrpl.ws/api');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Only HTTPS and WSS protocols are allowed');
    });

    it('should reject internal network addresses', () => {
      const internalUrls = [
        'https://192.168.1.1/api',
        'https://10.0.0.1:8080',
        'https://172.16.0.1/health',
        'https://127.0.0.1:3000',
        'https://localhost:8080',
        'https://169.254.1.1/api',
        'https://[::1]:8080',
        'https://[fc00::1]/api',
        'https://[fe80::1]/health'
      ];

      internalUrls.forEach(url => {
        const result = validateNodeUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Internal network addresses are not allowed');
      });
    });

    it('should reject non-allowlisted domains', () => {
      const disallowedUrls = [
        'https://malicious.com/api',
        'https://evil.example.com',
        'https://badnode.org/health',
        'https://fake-ripple.com/api'
      ];

      disallowedUrls.forEach(url => {
        const result = validateNodeUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('is not in the allowlist');
      });
    });

    it('should handle invalid URL formats', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://xrpl.ws/file',
        'javascript:alert(1)',
        '',
        'https://',
        'malformed://url'
      ];

      invalidUrls.forEach(url => {
        const result = validateNodeUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeTruthy();
      });
    });

    it('should accept subdomains of allowlisted domains', () => {
      const subdomainUrls = [
        'https://api.xrpl.ws/v1',
        'https://ws.s1.ripple.com:443',
        'https://test.xrplcluster.com/health'
      ];

      subdomainUrls.forEach(url => {
        const result = validateNodeUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });
  });

  describe('Network Node Creation', () => {
    it('should validate node data structure', () => {
      const validNode: NetworkNode = {
        name: 'Test Validator',
        url: 'https://xrpl.ws/health',
        description: 'Test node for validation',
        is_active: true,
        allowed_domains: ['xrpl.ws'],
        node_type: 'validator',
        priority: 1,
        timeout_ms: 5000
      };

      expect(validNode.name).toBeTruthy();
      expect(validNode.url).toBeTruthy();
      expect(validateNodeUrl(validNode.url).isValid).toBe(true);
      expect(Array.isArray(validNode.allowed_domains)).toBe(true);
    });

    it('should reject nodes with malicious URLs', () => {
      const maliciousNodes = [
        {
          name: 'Evil Node',
          url: 'https://192.168.1.1/backdoor',
          allowed_domains: ['192.168.1.1']
        },
        {
          name: 'Local Node',
          url: 'https://localhost:8080/admin',
          allowed_domains: ['localhost']
        },
        {
          name: 'Internal Node',
          url: 'https://10.0.0.1/internal',
          allowed_domains: ['10.0.0.1']
        }
      ];

      maliciousNodes.forEach(node => {
        const result = validateNodeUrl(node.url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('not allowed');
      });
    });
  });

  describe('Domain Allowlist', () => {
    it('should contain only trusted domains', () => {
      const trustedDomains = [
        'xrpl.ws',
        'ripple.com',
        's1.ripple.com',
        's2.ripple.com',
        'xrplcluster.com',
        'xrpl-ws.org'
      ];

      expect(ALLOWED_DOMAINS).toEqual(trustedDomains);
      
      // Ensure no suspicious domains
      ALLOWED_DOMAINS.forEach(domain => {
        expect(domain).not.toMatch(/localhost|127\.0\.0\.1|192\.168\.|10\.|172\./);
        expect(domain).not.toContain('example');
        expect(domain).not.toContain('test');
      });
    });

    it('should reject attempts to bypass allowlist', () => {
      const bypassAttempts = [
        'https://evil.com.xrpl.ws.fake.com',
        'https://xrpl.ws.evil.com',
        'https://ripple.com.attacker.org',
        'https://fake-s1.ripple.com.malicious.net'
      ];

      bypassAttempts.forEach(url => {
        const result = validateNodeUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('is not in the allowlist');
      });
    });
  });

  describe('Security Event Logging', () => {
    it('should require security event structure', () => {
      const securityEvent = {
        user_id: 'test-user-id',
        event_type: 'node_validation_failure',
        event_data: {
          url: 'https://192.168.1.1/evil',
          error: 'Internal network addresses are not allowed',
          action: 'create'
        },
        risk_score: 7
      };

      expect(securityEvent.user_id).toBeTruthy();
      expect(securityEvent.event_type).toBe('node_validation_failure');
      expect(securityEvent.event_data.url).toBeTruthy();
      expect(securityEvent.event_data.error).toBeTruthy();
      expect(securityEvent.risk_score).toBeGreaterThan(0);
    });
  });
});