import { supabase } from "@/integrations/supabase/client";

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  component?: string;
  function?: string;
  metadata?: Record<string, any>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: string;
  error?: Error;
  stack?: string;
}

class Logger {
  private context: LogContext = {};
  private sessionId: string;

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.initializeContext();
  }

  private initializeContext() {
    // Get basic browser context
    if (typeof window !== 'undefined') {
      this.context = {
        ...this.context,
        sessionId: this.sessionId,
        userAgent: window.navigator.userAgent,
        // Note: IP address will be set by edge functions
      };
    }
  }

  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context };
  }

  private async getUserContext(): Promise<Partial<LogContext>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user ? { userId: user.id } : {};
    } catch {
      return {};
    }
  }

  private createLogEntry(level: LogLevel, message: string, error?: Error): LogEntry {
    return {
      level,
      message,
      context: this.context,
      timestamp: new Date().toISOString(),
      error,
      stack: error?.stack,
    };
  }

  private async sendToBackend(entry: LogEntry) {
    try {
      // Send to Logflare/Datadog equivalent (using Supabase edge function)
      await supabase.functions.invoke('logger-service', {
        body: {
          level: entry.level,
          message: entry.message,
          context: entry.context,
          timestamp: entry.timestamp,
          error: entry.error ? {
            name: entry.error.name,
            message: entry.error.message,
            stack: entry.error.stack,
          } : undefined,
        },
      });
    } catch (error) {
      // Fallback to console if backend logging fails
      console.error('Failed to send log to backend:', error);
      this.fallbackToConsole(entry);
    }
  }

  private fallbackToConsole(entry: LogEntry) {
    const logMessage = `[${entry.level.toUpperCase()}] ${entry.timestamp} - ${entry.message}`;
    const contextInfo = entry.context.userId 
      ? ` (User: ${entry.context.userId.slice(0, 8)}...)`
      : ' (Anonymous)';
    
    switch (entry.level) {
      case 'debug':
        console.debug(logMessage + contextInfo, entry.context, entry.error);
        break;
      case 'info':
        console.info(logMessage + contextInfo, entry.context);
        break;
      case 'warn':
        console.warn(logMessage + contextInfo, entry.context, entry.error);
        break;
      case 'error':
      case 'critical':
        console.error(logMessage + contextInfo, entry.context, entry.error);
        break;
    }
  }

  private async logEntry(level: LogLevel, message: string, error?: Error) {
    // Get current user context
    const userContext = await this.getUserContext();
    const updatedContext = { ...this.context, ...userContext };
    
    const entry: LogEntry = {
      level,
      message,
      context: updatedContext,
      timestamp: new Date().toISOString(),
      error,
      stack: error?.stack,
    };

    // Always log to console for development
    if (import.meta.env.DEV) {
      this.fallbackToConsole(entry);
    }

    // Send to backend service for aggregation
    if (level !== 'debug' || !import.meta.env.DEV) {
      await this.sendToBackend(entry);
    }

    // For critical errors, send alerts
    if (level === 'critical') {
      await this.sendAlert(entry);
    }
  }

  private async sendAlert(entry: LogEntry) {
    try {
      await supabase.functions.invoke('alert-service', {
        body: {
          type: 'critical_error',
          message: entry.message,
          context: entry.context,
          error: entry.error ? {
            name: entry.error.name,
            message: entry.error.message,
            stack: entry.error.stack,
          } : undefined,
          timestamp: entry.timestamp,
        },
      });
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.setContext({ metadata });
    this.logEntry('debug', message);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.setContext({ metadata });
    this.logEntry('info', message);
  }

  warn(message: string, error?: Error, metadata?: Record<string, any>) {
    this.setContext({ metadata });
    this.logEntry('warn', message, error);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>) {
    this.setContext({ metadata });
    this.logEntry('error', message, error);
  }

  critical(message: string, error?: Error, metadata?: Record<string, any>) {
    this.setContext({ metadata });
    this.logEntry('critical', message, error);
  }

  // Security event logging
  security(event: string, details: Record<string, any>) {
    this.info(`SECURITY_EVENT: ${event}`, { 
      security: true, 
      event_type: event, 
      ...details 
    });
  }

  // Performance logging
  performance(action: string, duration: number, metadata?: Record<string, any>) {
    this.info(`PERFORMANCE: ${action} completed in ${duration}ms`, {
      performance: true,
      action,
      duration,
      ...metadata
    });
  }

  // Business event logging
  business(event: string, data: Record<string, any>) {
    this.info(`BUSINESS_EVENT: ${event}`, {
      business: true,
      event_type: event,
      ...data
    });
  }
}

// Edge function logger for Deno environment
export class EdgeLogger {
  private context: LogContext;

  constructor(functionName: string, request?: Request) {
    this.context = {
      function: functionName,
      requestId: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
    };

    if (request) {
      this.context = {
        ...this.context,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || undefined,
      };
    }
  }

  setUser(userId: string) {
    this.context.userId = userId;
  }

  private createLogEntry(level: LogLevel, message: string, error?: Error): LogEntry {
    return {
      level,
      message,
      context: this.context,
      timestamp: new Date().toISOString(),
      error,
      stack: error?.stack,
    };
  }

  private formatLog(entry: LogEntry): string {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    const context = entry.context.function ? ` [${entry.context.function}]` : '';
    const user = entry.context.userId ? ` (User: ${entry.context.userId.slice(0, 8)}...)` : '';
    return `${prefix}${context}${user} - ${entry.message}`;
  }

  debug(message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('debug', message);
    console.log(this.formatLog(entry), metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('info', message);
    console.log(this.formatLog(entry), metadata);
  }

  warn(message: string, error?: Error, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('warn', message, error);
    console.warn(this.formatLog(entry), error, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('error', message, error);
    console.error(this.formatLog(entry), error, metadata);
  }

  critical(message: string, error?: Error, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('critical', message, error);
    console.error(`🚨 CRITICAL: ${this.formatLog(entry)}`, error, metadata);
  }

  security(event: string, details: Record<string, any>) {
    const entry = this.createLogEntry('warn', `SECURITY_EVENT: ${event}`);
    console.warn(`🔒 ${this.formatLog(entry)}`, details);
  }

  performance(action: string, duration: number, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('info', `PERFORMANCE: ${action} completed in ${duration}ms`);
    console.log(`⚡ ${this.formatLog(entry)}`, metadata);
  }
}

// Create singleton instance
export const logger = new Logger();

// Component logger factory
export function createComponentLogger(componentName: string) {
  const componentLogger = new Logger();
  componentLogger.setContext({ component: componentName });
  return componentLogger;
}

// Hook for React components
export function useLogger(componentName: string) {
  const componentLogger = createComponentLogger(componentName);
  return componentLogger;
}