import { EdgeLogger } from "./logger-utils.ts";

export interface ErrorResponse {
  error: string;
  correlationId: string;
  timestamp: string;
  details?: any;
}

export interface ErrorContext {
  userId?: string;
  functionName?: string;
  requestId?: string;
  clientInfo?: {
    ip?: string;
    userAgent?: string;
  };
  additionalContext?: Record<string, any>;
}

export enum ErrorType {
  // Authentication & Authorization
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
  INVALID_AUTHENTICATION = "INVALID_AUTHENTICATION",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  SUBSCRIPTION_REQUIRED = "SUBSCRIPTION_REQUIRED",

  // Input Validation
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELDS = "MISSING_REQUIRED_FIELDS",
  INVALID_FORMAT = "INVALID_FORMAT",
  OUT_OF_RANGE = "OUT_OF_RANGE",

  // Business Logic
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",

  // External Services
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  EXTERNAL_SERVICE_TIMEOUT = "EXTERNAL_SERVICE_TIMEOUT",
  EXTERNAL_SERVICE_UNAVAILABLE = "EXTERNAL_SERVICE_UNAVAILABLE",

  // Rate Limiting & Security
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  SECURITY_VIOLATION = "SECURITY_VIOLATION",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",

  // System Errors
  DATABASE_ERROR = "DATABASE_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR"
}

// User-friendly error messages (what users see)
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.AUTHENTICATION_REQUIRED]: "Authentication is required to access this resource",
  [ErrorType.INVALID_AUTHENTICATION]: "Invalid authentication credentials",
  [ErrorType.INSUFFICIENT_PERMISSIONS]: "You don't have permission to perform this action",
  [ErrorType.SUBSCRIPTION_REQUIRED]: "This feature requires an active subscription",

  [ErrorType.INVALID_INPUT]: "The provided input is invalid",
  [ErrorType.MISSING_REQUIRED_FIELDS]: "Required fields are missing",
  [ErrorType.INVALID_FORMAT]: "The data format is invalid",
  [ErrorType.OUT_OF_RANGE]: "The provided value is out of acceptable range",

  [ErrorType.RESOURCE_NOT_FOUND]: "The requested resource was not found",
  [ErrorType.RESOURCE_CONFLICT]: "The operation conflicts with existing data",
  [ErrorType.BUSINESS_RULE_VIOLATION]: "The operation violates business rules",
  [ErrorType.INSUFFICIENT_BALANCE]: "Insufficient balance to complete the operation",

  [ErrorType.EXTERNAL_SERVICE_ERROR]: "An external service is temporarily unavailable",
  [ErrorType.EXTERNAL_SERVICE_TIMEOUT]: "External service request timed out",
  [ErrorType.EXTERNAL_SERVICE_UNAVAILABLE]: "External service is currently unavailable",

  [ErrorType.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded. Please try again later",
  [ErrorType.SECURITY_VIOLATION]: "Security policy violation detected",
  [ErrorType.SUSPICIOUS_ACTIVITY]: "Suspicious activity detected. Request blocked",

  [ErrorType.DATABASE_ERROR]: "A database error occurred. Please try again",
  [ErrorType.INTERNAL_ERROR]: "An internal error occurred. Please try again",
  [ErrorType.CONFIGURATION_ERROR]: "Service configuration error. Please contact support",
  [ErrorType.TIMEOUT_ERROR]: "Request timed out. Please try again"
};

// HTTP status codes for different error types
const ERROR_STATUS_CODES: Record<ErrorType, number> = {
  [ErrorType.AUTHENTICATION_REQUIRED]: 401,
  [ErrorType.INVALID_AUTHENTICATION]: 401,
  [ErrorType.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorType.SUBSCRIPTION_REQUIRED]: 402,

  [ErrorType.INVALID_INPUT]: 400,
  [ErrorType.MISSING_REQUIRED_FIELDS]: 400,
  [ErrorType.INVALID_FORMAT]: 400,
  [ErrorType.OUT_OF_RANGE]: 400,

  [ErrorType.RESOURCE_NOT_FOUND]: 404,
  [ErrorType.RESOURCE_CONFLICT]: 409,
  [ErrorType.BUSINESS_RULE_VIOLATION]: 422,
  [ErrorType.INSUFFICIENT_BALANCE]: 422,

  [ErrorType.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorType.EXTERNAL_SERVICE_TIMEOUT]: 504,
  [ErrorType.EXTERNAL_SERVICE_UNAVAILABLE]: 503,

  [ErrorType.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorType.SECURITY_VIOLATION]: 403,
  [ErrorType.SUSPICIOUS_ACTIVITY]: 403,

  [ErrorType.DATABASE_ERROR]: 500,
  [ErrorType.INTERNAL_ERROR]: 500,
  [ErrorType.CONFIGURATION_ERROR]: 500,
  [ErrorType.TIMEOUT_ERROR]: 408
};

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly correlationId: string;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;

  constructor(
    type: ErrorType,
    message?: string,
    context?: ErrorContext,
    isOperational: boolean = true
  ) {
    super(message || ERROR_MESSAGES[type]);
    
    this.type = type;
    this.statusCode = ERROR_STATUS_CODES[type];
    this.correlationId = crypto.randomUUID();
    this.isOperational = isOperational;
    this.context = context;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, AppError);
  }
}

export class ErrorHandler {
  private logger: EdgeLogger;
  private corsHeaders: Record<string, string>;

  constructor(logger: EdgeLogger, corsHeaders: Record<string, string> = {}) {
    this.logger = logger;
    this.corsHeaders = corsHeaders;
  }

  /**
   * Maps various error types to AppError instances
   */
  private mapError(error: any, context?: ErrorContext): AppError {
    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // Database errors
    if (lowerMessage.includes('permission denied') || lowerMessage.includes('rls')) {
      return new AppError(ErrorType.INSUFFICIENT_PERMISSIONS, undefined, context);
    }
    
    if (lowerMessage.includes('not found') || lowerMessage.includes('pgrst116')) {
      return new AppError(ErrorType.RESOURCE_NOT_FOUND, undefined, context);
    }
    
    if (lowerMessage.includes('unique') || lowerMessage.includes('duplicate')) {
      return new AppError(ErrorType.RESOURCE_CONFLICT, undefined, context);
    }
    
    if (lowerMessage.includes('invalid input') || lowerMessage.includes('invalid uuid')) {
      return new AppError(ErrorType.INVALID_INPUT, undefined, context);
    }

    // Authentication errors
    if (lowerMessage.includes('jwt') || lowerMessage.includes('token') || 
        lowerMessage.includes('authentication') || lowerMessage.includes('unauthorized')) {
      return new AppError(ErrorType.INVALID_AUTHENTICATION, undefined, context);
    }

    // External service errors
    if (lowerMessage.includes('fetch') || lowerMessage.includes('network') ||
        lowerMessage.includes('timeout') || lowerMessage.includes('abort')) {
      if (lowerMessage.includes('timeout') || lowerMessage.includes('abort')) {
        return new AppError(ErrorType.EXTERNAL_SERVICE_TIMEOUT, undefined, context);
      }
      return new AppError(ErrorType.EXTERNAL_SERVICE_ERROR, undefined, context);
    }

    // Rate limiting
    if (lowerMessage.includes('too many requests') || lowerMessage.includes('rate limit')) {
      return new AppError(ErrorType.RATE_LIMIT_EXCEEDED, undefined, context);
    }

    // Validation errors
    if (lowerMessage.includes('required') || lowerMessage.includes('missing')) {
      return new AppError(ErrorType.MISSING_REQUIRED_FIELDS, undefined, context);
    }

    // Default to internal error for unknown errors
    return new AppError(ErrorType.INTERNAL_ERROR, undefined, context, false);
  }

  /**
   * Logs error with full details server-side
   */
  private logError(appError: AppError, originalError?: any): void {
    const logData = {
      correlationId: appError.correlationId,
      errorType: appError.type,
      statusCode: appError.statusCode,
      isOperational: appError.isOperational,
      context: appError.context,
      stack: appError.stack,
      originalError: originalError ? {
        message: originalError.message,
        stack: originalError.stack,
        name: originalError.name
      } : undefined
    };

    if (appError.statusCode >= 500) {
      this.logger.error("Server error occurred", appError, logData);
    } else if (appError.statusCode >= 400) {
      this.logger.warn("Client error occurred", undefined, logData);
    } else {
      this.logger.info("Error handled", logData);
    }

    // Log security violations with higher priority
    if (appError.type === ErrorType.SECURITY_VIOLATION || 
        appError.type === ErrorType.SUSPICIOUS_ACTIVITY) {
      this.logger.security("security_error", logData);
    }
  }

  /**
   * Creates a sanitized error response for the client
   */
  private createErrorResponse(appError: AppError): ErrorResponse {
    return {
      error: ERROR_MESSAGES[appError.type],
      correlationId: appError.correlationId,
      timestamp: new Date().toISOString(),
      // Only include details for client errors, not server errors
      details: appError.statusCode < 500 ? appError.context?.additionalContext : undefined
    };
  }

  /**
   * Main error handling method - call this from edge functions
   */
  public handleError(error: any, context?: ErrorContext): Response {
    const appError = this.mapError(error, context);
    
    // Log the error server-side
    this.logError(appError, error);
    
    // Create sanitized response
    const errorResponse = this.createErrorResponse(appError);
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: appError.statusCode,
        headers: {
          ...this.corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }

  /**
   * Convenience method for creating typed errors
   */
  public static createError(
    type: ErrorType, 
    message?: string, 
    context?: ErrorContext
  ): AppError {
    return new AppError(type, message, context);
  }

  /**
   * Convenience method for authentication errors
   */
  public static authenticationRequired(context?: ErrorContext): AppError {
    return new AppError(ErrorType.AUTHENTICATION_REQUIRED, undefined, context);
  }

  /**
   * Convenience method for validation errors
   */
  public static invalidInput(message?: string, context?: ErrorContext): AppError {
    return new AppError(ErrorType.INVALID_INPUT, message, context);
  }

  /**
   * Convenience method for not found errors
   */
  public static notFound(resource?: string, context?: ErrorContext): AppError {
    const message = resource ? `${resource} not found` : undefined;
    return new AppError(ErrorType.RESOURCE_NOT_FOUND, message, context);
  }

  /**
   * Convenience method for permission errors
   */
  public static insufficientPermissions(context?: ErrorContext): AppError {
    return new AppError(ErrorType.INSUFFICIENT_PERMISSIONS, undefined, context);
  }
}

/**
 * Factory function to create error handler with common setup
 */
export function createErrorHandler(
  functionName: string, 
  request?: Request,
  corsHeaders: Record<string, string> = {}
): ErrorHandler {
  const logger = new EdgeLogger(functionName, request);
  return new ErrorHandler(logger, corsHeaders);
}

/**
 * Convenience function for quick error responses (legacy compatibility)
 */
export function getErrorResponse(
  error: any, 
  functionName: string, 
  request?: Request,
  corsHeaders: Record<string, string> = {},
  context?: ErrorContext
): Response {
  const errorHandler = createErrorHandler(functionName, request, corsHeaders);
  return errorHandler.handleError(error, context);
}