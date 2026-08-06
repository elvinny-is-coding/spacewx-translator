// lib/logger.ts

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (this.isDevelopment) {
      const logMethod =
        level === "error"
          ? console.error
          : level === "warn"
            ? console.warn
            : level === "debug"
              ? console.debug
              : console.log;

      logMethod(`[${level.toUpperCase()}] ${message}`, context || "");
    } else {
      // In production, only log errors and warnings
      if (level === "error" || level === "warn") {
        console.error(JSON.stringify(entry));
      }
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log("error", message, context);
  }
}

export const logger = new Logger();
