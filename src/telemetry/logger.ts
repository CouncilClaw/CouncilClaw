/**
 * Structured logging module for CouncilClaw
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
  };
}

class Logger {
  private minLevel: LogLevel = process.env.DEBUG === "true" ? "debug" : "info";

  private levelRank = { debug: 0, info: 1, warn: 2, error: 3 };

  private formatEntry(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}]`;
    const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    const error = entry.error ? ` | Error: ${entry.error.name} - ${entry.error.message}` : "";
    return `${prefix} ${entry.message}${ctx}${error}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelRank[level] >= this.levelRank[this.minLevel];
  }

  private log(level: LogLevel, module: string, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          code: (error as any).code,
          stack: error.stack,
        },
      }),
    };

    const formatted = this.formatEntry(entry);
    const stream = level === "error" || level === "warn" ? console.error : console.log;
    stream(formatted);
  }

  debug(module: string, message: string, context?: Record<string, unknown>): void {
    this.log("debug", module, message, context);
  }

  info(module: string, message: string, context?: Record<string, unknown>): void {
    this.log("info", module, message, context);
  }

  warn(module: string, message: string, context?: Record<string, unknown>): void {
    this.log("warn", module, message, context);
  }

  error(module: string, message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log("error", module, message, context, error);
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

export const logger = new Logger();
