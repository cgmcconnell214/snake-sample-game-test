import { EdgeLogger } from "./logger-utils.ts";

interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  reason?: string;
}

interface ValidationOptions {
  allowedDomains?: string[];
  blockedDomains?: string[];
  allowedProtocols?: string[];
  maxContentLength?: number;
  timeout?: number;
  enablePrivateNetworkBlocking?: boolean;
}

export class UrlValidator {
  private logger: EdgeLogger;
  private options: ValidationOptions;

  constructor(logger: EdgeLogger, options: ValidationOptions = {}) {
    this.logger = logger;
    this.options = {
      allowedDomains: options.allowedDomains || [],
      blockedDomains: options.blockedDomains || [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        'internal',
        'admin',
        'management'
      ],
      allowedProtocols: options.allowedProtocols || ['https:', 'http:'],
      maxContentLength: options.maxContentLength || 50 * 1024 * 1024, // 50MB
      timeout: options.timeout || 30000, // 30 seconds
      enablePrivateNetworkBlocking: options.enablePrivateNetworkBlocking ?? true,
      ...options
    };
  }

  async validateUrl(url: string, clientInfo?: any): Promise<UrlValidationResult> {
    try {
      // Basic URL format validation
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch (error) {
        return this.logAndReturnError('Invalid URL format', { url, error: error.message }, clientInfo);
      }

      // Protocol validation
      if (!this.options.allowedProtocols!.includes(parsedUrl.protocol)) {
        return this.logAndReturnError('Protocol not allowed', { 
          url, 
          protocol: parsedUrl.protocol,
          allowed: this.options.allowedProtocols
        }, clientInfo);
      }

      // Domain validation
      if (this.options.allowedDomains!.length > 0) {
        const isAllowed = this.options.allowedDomains!.some(domain => 
          parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
        );
        if (!isAllowed) {
          return this.logAndReturnError('Domain not in allowlist', { 
            url, 
            hostname: parsedUrl.hostname,
            allowedDomains: this.options.allowedDomains
          }, clientInfo);
        }
      }

      // Blocked domains check
      const isBlocked = this.options.blockedDomains!.some(domain => 
        parsedUrl.hostname === domain || 
        parsedUrl.hostname.endsWith('.' + domain) ||
        parsedUrl.hostname.includes(domain)
      );
      if (isBlocked) {
        return this.logAndReturnError('Domain is blocked', { 
          url, 
          hostname: parsedUrl.hostname 
        }, clientInfo);
      }

      // Private network IP validation
      if (this.options.enablePrivateNetworkBlocking) {
        const isPrivate = await this.isPrivateNetworkIP(parsedUrl.hostname);
        if (isPrivate) {
          return this.logAndReturnError('Private network access denied', { 
            url, 
            hostname: parsedUrl.hostname 
          }, clientInfo);
        }
      }

      // Additional security checks
      const securityCheck = this.performSecurityChecks(parsedUrl);
      if (!securityCheck.isValid) {
        return this.logAndReturnError(securityCheck.error!, { url }, clientInfo);
      }

      return { isValid: true };

    } catch (error) {
      return this.logAndReturnError('Validation error', { 
        url, 
        error: error.message 
      }, clientInfo);
    }
  }

  private async isPrivateNetworkIP(hostname: string): Promise<boolean> {
    // Check for private IP ranges
    const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|0\.0\.0\.0|::1|localhost).*$/i;
    
    if (privateIPRegex.test(hostname)) {
      return true;
    }

    // For domain names, try to resolve and check if they point to private IPs
    try {
      // In a real implementation, you might use DNS resolution
      // For now, we'll just check common patterns
      const suspiciousPatterns = [
        /^.*\.local$/i,
        /^.*\.internal$/i,
        /^.*\.corp$/i,
        /^admin\./i,
        /^management\./i,
        /^internal\./i
      ];

      return suspiciousPatterns.some(pattern => pattern.test(hostname));
    } catch {
      // If resolution fails, allow the request but log it
      this.logger.warn('DNS resolution failed for hostname', { hostname });
      return false;
    }
  }

  private performSecurityChecks(url: URL): UrlValidationResult {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\.\//, // Path traversal
      /@/, // Potential user info in URL
      /javascript:/i, // JavaScript protocol
      /data:/i, // Data protocol
      /file:/i, // File protocol
      /ftp:/i, // FTP protocol
    ];

    const fullUrl = url.toString();
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fullUrl)) {
        return {
          isValid: false,
          error: 'URL contains suspicious patterns'
        };
      }
    }

    // Check URL length
    if (fullUrl.length > 2000) {
      return {
        isValid: false,
        error: 'URL too long'
      };
    }

    return { isValid: true };
  }

  async validateAndFetch(url: string, clientInfo?: any): Promise<{ isValid: boolean; error?: string; response?: Response }> {
    const validation = await this.validateUrl(url, clientInfo);
    if (!validation.isValid) {
      return validation;
    }

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      const response = await fetch(url, {
        method: 'HEAD', // Use HEAD to check headers without downloading content
        signal: controller.signal,
        headers: {
          'User-Agent': 'Secure-Scraper/1.0'
        }
      });

      clearTimeout(timeoutId);

      // Check content length
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > this.options.maxContentLength!) {
        return this.logAndReturnError('Content too large', { 
          url, 
          contentLength: parseInt(contentLength),
          maxAllowed: this.options.maxContentLength
        }, clientInfo);
      }

      // Check content type for suspicious types
      const contentType = response.headers.get('content-type');
      if (contentType && this.isSuspiciousContentType(contentType)) {
        return this.logAndReturnError('Suspicious content type', { 
          url, 
          contentType 
        }, clientInfo);
      }

      return { isValid: true, response };

    } catch (error) {
      if (error.name === 'AbortError') {
        return this.logAndReturnError('Request timeout', { url }, clientInfo);
      }
      return this.logAndReturnError('Fetch error', { 
        url, 
        error: error.message 
      }, clientInfo);
    }
  }

  private isSuspiciousContentType(contentType: string): boolean {
    const suspicious = [
      'application/x-executable',
      'application/x-msdownload',
      'application/octet-stream',
      'application/x-shockwave-flash'
    ];
    
    return suspicious.some(type => contentType.toLowerCase().includes(type));
  }

  private logAndReturnError(error: string, details: any, clientInfo?: any): UrlValidationResult {
    this.logger.security('url_validation_failed', {
      error,
      details,
      clientInfo: {
        ip: clientInfo?.ip,
        userAgent: clientInfo?.userAgent,
        userId: clientInfo?.userId
      }
    });

    return {
      isValid: false,
      error,
      reason: details
    };
  }
}

// Default validator factory
export function createUrlValidator(logger: EdgeLogger, customOptions?: ValidationOptions): UrlValidator {
  // Default allowed domains for common legitimate sites
  const defaultOptions: ValidationOptions = {
    allowedDomains: [
      // News and information
      'wikipedia.org',
      'reddit.com',
      'stackoverflow.com',
      'github.com',
      'medium.com',
      'dev.to',
      
      // Business and documentation
      'docs.google.com',
      'drive.google.com',
      'dropbox.com',
      'notion.so',
      
      // Common domains (be more restrictive in production)
      ...(Deno.env.get('ENVIRONMENT') === 'development' ? ['example.com', 'httpbin.org'] : [])
    ],
    maxContentLength: 25 * 1024 * 1024, // 25MB limit
    timeout: 20000, // 20 second timeout
    enablePrivateNetworkBlocking: true,
    ...customOptions
  };

  return new UrlValidator(logger, defaultOptions);
}