// supabase/functions/_shared/logger.ts

const SENTRY_DSN = Deno.env.get('SENTRY_DSN') || Deno.env.get('VITE_SENTRY_DSN');

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

interface LogContext {
  [key: string]: any;
}

/**
 * Basic Logger for Supabase Edge Functions.
 * Reports to console and optionally to Sentry if DSN is provided.
 */
export class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private async reportToSentry(level: LogLevel, message: string, context?: LogContext) {
    if (!SENTRY_DSN) return;

    try {
      // Basic Sentry Store API call (for Edge Runtime compatibility)
      const event = {
        message,
        level: level.toLowerCase(),
        platform: 'javascript',
        app_name: 'skiip-api',
        server_name: 'supabase-edge',
        extra: {
          service: this.serviceName,
          ...context
        },
        timestamp: new Date().toISOString(),
      };

      await fetch(`https://sentry.io/api/0/store/?sentry_key=${SENTRY_DSN.split('@')[0].split('//')[1]}&sentry_version=7`, {
        method: 'POST',
        body: JSON.stringify(event),
      });
    } catch (e) {
      console.error('Failed to report to Sentry:', e);
    }
  }

  info(message: string, context?: LogContext) {
    console.log(`[${this.serviceName}] [INFO] ${message}`, context || '');
  }

  warn(message: string, context?: LogContext) {
    console.warn(`[${this.serviceName}] [WARN] ${message}`, context || '');
    this.reportToSentry(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext) {
    console.error(`[${this.serviceName}] [ERROR] ${message}`, context || '');
    this.reportToSentry(LogLevel.ERROR, message, context);
  }

  debug(message: string, context?: LogContext) {
    if (Deno.env.get('DEBUG') === 'true') {
      console.debug(`[${this.serviceName}] [DEBUG] ${message}`, context || '');
    }
  }
}

export const logger = (serviceName: string) => new Logger(serviceName);
