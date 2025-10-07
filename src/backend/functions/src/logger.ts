/**
 * Production logging utility with structured logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private serviceName: string;
  private minLevel: LogLevel;

  constructor(serviceName: string = 'tim-burton-api', minLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatLog(entry: LogEntry): string {
    const logEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      service: this.serviceName
    };

    return JSON.stringify(logEntry);
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      metadata
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    const formattedLog = this.formatLog(entry);
    
    // Use appropriate console method based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  // Business-specific logging methods
  logPurchase(userId: string, purchaseId: string, amount: number, currency: string): void {
    this.info('Purchase completed', {
      userId,
      purchaseId,
      amount,
      currency,
      event: 'purchase_completed'
    });
  }

  logWebhookEvent(eventType: string, eventId: string, success: boolean, processingTime?: number): void {
    this.info('Webhook event processed', {
      eventType,
      eventId,
      success,
      processingTime,
      event: 'webhook_processed'
    });
  }

  logAuthEvent(userId: string, event: string, success: boolean, metadata?: Record<string, any>): void {
    this.info('Authentication event', {
      userId,
      eventType: event,
      success,
      ...metadata,
      event: 'auth_event'
    });
  }

  logError(error: Error, context: string, metadata?: Record<string, any>): void {
    this.error(`Error in ${context}`, error, {
      context,
      ...metadata,
      event: 'error_occurred'
    });
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, any>): void {
    const level = severity === 'critical' ? LogLevel.ERROR : 
                  severity === 'high' ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, `Security event: ${event}`, {
      securityEvent: event,
      severity,
      ...metadata,
      event: 'security_event'
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export individual methods for convenience
export const { debug, info, warn, error, logPurchase, logWebhookEvent, logAuthEvent, logError, logSecurityEvent } = logger;
