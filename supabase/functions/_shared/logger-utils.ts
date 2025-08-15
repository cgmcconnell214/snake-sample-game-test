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