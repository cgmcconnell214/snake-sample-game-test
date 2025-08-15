import { describe, it, expect, beforeEach } from 'vitest';

// Mock CSP directive parsing for testing
interface CSPDirective {
  name: string;
  sources: string[];
}

function parseCSP(cspString: string): CSPDirective[] {
  return cspString
    .split(';')
    .map(directive => directive.trim())
    .filter(directive => directive.length > 0)
    .map(directive => {
      const parts = directive.split(/\s+/);
      return {
        name: parts[0],
        sources: parts.slice(1)
      };
    });
}

// Test CSP policy string (matches the one in index.html)
const CSP_POLICY = `
  default-src 'self';
  script-src 'self' 'nonce-theme-script';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  media-src 'self' blob:;
  connect-src 'self' 
    https://bkxbkaggxqcsiylwcopt.supabase.co 
    https://api.xrpl.org 
    https://ipapi.co
    https://xrpl.ws
    https://s1.ripple.com
    https://s2.ripple.com
    https://xrplcluster.com
    https://xrpl-ws.org
    wss://bkxbkaggxqcsiylwcopt.supabase.co
    wss://xrpl.ws;
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://bkxbkaggxqcsiylwcopt.supabase.co;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();

describe('Content Security Policy', () => {
  let cspDirectives: CSPDirective[];

  beforeEach(() => {
    cspDirectives = parseCSP(CSP_POLICY);
  });

  describe('Core Security Directives', () => {
    it('should have restrictive default-src policy', () => {
      const defaultSrc = cspDirectives.find(d => d.name === 'default-src');
      expect(defaultSrc).toBeTruthy();
      expect(defaultSrc?.sources).toContain("'self'");
      expect(defaultSrc?.sources).toHaveLength(1);
    });

    it('should prevent object and embed injection', () => {
      const objectSrc = cspDirectives.find(d => d.name === 'object-src');
      expect(objectSrc).toBeTruthy();
      expect(objectSrc?.sources).toContain("'none'");
    });

    it('should prevent framing attacks', () => {
      const frameAncestors = cspDirectives.find(d => d.name === 'frame-ancestors');
      expect(frameAncestors).toBeTruthy();
      expect(frameAncestors?.sources).toContain("'none'");
    });

    it('should restrict base URI', () => {
      const baseUri = cspDirectives.find(d => d.name === 'base-uri');
      expect(baseUri).toBeTruthy();
      expect(baseUri?.sources).toContain("'self'");
    });

    it('should upgrade insecure requests', () => {
      const upgradeInsecure = cspDirectives.find(d => d.name === 'upgrade-insecure-requests');
      expect(upgradeInsecure).toBeTruthy();
    });
  });

  describe('Script Security', () => {
    it('should use nonce for inline scripts', () => {
      const scriptSrc = cspDirectives.find(d => d.name === 'script-src');
      expect(scriptSrc).toBeTruthy();
      expect(scriptSrc?.sources).toContain("'self'");
      expect(scriptSrc?.sources).toContain("'nonce-theme-script'");
      expect(scriptSrc?.sources).not.toContain("'unsafe-inline'");
      expect(scriptSrc?.sources).not.toContain("'unsafe-eval'");
    });

    it('should not allow unsafe script evaluation', () => {
      const scriptSrc = cspDirectives.find(d => d.name === 'script-src');
      expect(scriptSrc?.sources).not.toContain("'unsafe-eval'");
    });
  });

  describe('Style Security', () => {
    it('should allow Google Fonts', () => {
      const styleSrc = cspDirectives.find(d => d.name === 'style-src');
      expect(styleSrc).toBeTruthy();
      expect(styleSrc?.sources).toContain("'self'");
      expect(styleSrc?.sources).toContain('https://fonts.googleapis.com');
    });

    it('should allow font loading from Google', () => {
      const fontSrc = cspDirectives.find(d => d.name === 'font-src');
      expect(fontSrc).toBeTruthy();
      expect(fontSrc?.sources).toContain("'self'");
      expect(fontSrc?.sources).toContain('https://fonts.gstatic.com');
    });
  });

  describe('Connection Security', () => {
    it('should allow Supabase connections', () => {
      const connectSrc = cspDirectives.find(d => d.name === 'connect-src');
      expect(connectSrc).toBeTruthy();
      expect(connectSrc?.sources).toContain('https://bkxbkaggxqcsiylwcopt.supabase.co');
      expect(connectSrc?.sources).toContain('wss://bkxbkaggxqcsiylwcopt.supabase.co');
    });

    it('should allow XRPL API connections', () => {
      const connectSrc = cspDirectives.find(d => d.name === 'connect-src');
      expect(connectSrc?.sources).toContain('https://api.xrpl.org');
      expect(connectSrc?.sources).toContain('https://xrpl.ws');
      expect(connectSrc?.sources).toContain('wss://xrpl.ws');
    });

    it('should allow IP geolocation service', () => {
      const connectSrc = cspDirectives.find(d => d.name === 'connect-src');
      expect(connectSrc?.sources).toContain('https://ipapi.co');
    });

    it('should allow trusted XRPL nodes only', () => {
      const connectSrc = cspDirectives.find(d => d.name === 'connect-src');
      const allowedNodes = [
        'https://xrpl.ws',
        'https://s1.ripple.com',
        'https://s2.ripple.com',
        'https://xrplcluster.com',
        'https://xrpl-ws.org'
      ];
      
      allowedNodes.forEach(node => {
        expect(connectSrc?.sources).toContain(node);
      });
    });

    it('should not allow arbitrary external connections', () => {
      const connectSrc = cspDirectives.find(d => d.name === 'connect-src');
      
      // Should not contain wildcards or overly permissive sources
      expect(connectSrc?.sources).not.toContain('*');
      expect(connectSrc?.sources).not.toContain('https:');
      expect(connectSrc?.sources).not.toContain('http:');
    });
  });

  describe('Media and Image Security', () => {
    it('should allow various image sources', () => {
      const imgSrc = cspDirectives.find(d => d.name === 'img-src');
      expect(imgSrc).toBeTruthy();
      expect(imgSrc?.sources).toContain("'self'");
      expect(imgSrc?.sources).toContain('data:');
      expect(imgSrc?.sources).toContain('https:');
      expect(imgSrc?.sources).toContain('blob:');
    });

    it('should restrict media sources', () => {
      const mediaSrc = cspDirectives.find(d => d.name === 'media-src');
      expect(mediaSrc).toBeTruthy();
      expect(mediaSrc?.sources).toContain("'self'");
      expect(mediaSrc?.sources).toContain('blob:');
      expect(mediaSrc?.sources).not.toContain('https:');
    });
  });

  describe('Form Security', () => {
    it('should restrict form actions', () => {
      const formAction = cspDirectives.find(d => d.name === 'form-action');
      expect(formAction).toBeTruthy();
      expect(formAction?.sources).toContain("'self'");
      expect(formAction?.sources).toContain('https://bkxbkaggxqcsiylwcopt.supabase.co');
    });

    it('should restrict frame sources', () => {
      const frameSrc = cspDirectives.find(d => d.name === 'frame-src');
      expect(frameSrc).toBeTruthy();
      expect(frameSrc?.sources).toContain("'self'");
    });
  });

  describe('CSP Coverage', () => {
    it('should include all essential security directives', () => {
      const requiredDirectives = [
        'default-src',
        'script-src',
        'style-src',
        'font-src',
        'img-src',
        'connect-src',
        'frame-src',
        'object-src',
        'base-uri',
        'form-action',
        'frame-ancestors'
      ];

      requiredDirectives.forEach(directive => {
        const found = cspDirectives.find(d => d.name === directive);
        expect(found).toBeTruthy();
      });
    });

    it('should not contain deprecated or risky directives', () => {
      const riskyDirectives = ['plugin-types', 'referrer'];
      
      riskyDirectives.forEach(directive => {
        const found = cspDirectives.find(d => d.name === directive);
        expect(found).toBeFalsy();
      });
    });
  });

  describe('Nonce Security', () => {
    it('should use specific nonce values', () => {
      const scriptSrc = cspDirectives.find(d => d.name === 'script-src');
      const nonceSource = scriptSrc?.sources.find(s => s.startsWith("'nonce-"));
      
      expect(nonceSource).toBeTruthy();
      expect(nonceSource).toBe("'nonce-theme-script'");
    });

    it('should not mix nonce with unsafe-inline', () => {
      const scriptSrc = cspDirectives.find(d => d.name === 'script-src');
      
      if (scriptSrc?.sources.some(s => s.startsWith("'nonce-"))) {
        expect(scriptSrc?.sources).not.toContain("'unsafe-inline'");
      }
    });
  });
});