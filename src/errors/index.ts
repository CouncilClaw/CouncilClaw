/**
 * Custom error types for CouncilClaw
 */

export class CouncilClawError extends Error {
  constructor(message: string, public readonly code: string, public readonly context?: Record<string, unknown>) {
    super(message);
    this.name = "CouncilClawError";
    Error.captureStackTrace(this, CouncilClawError);
  }
}

export class ModelAPIError extends CouncilClawError {
  constructor(
    message: string,
    public readonly model: string,
    public readonly statusCode?: number,
    context?: Record<string, unknown>,
  ) {
    super(message, "MODEL_API_ERROR", { model, statusCode, ...context });
    this.name = "ModelAPIError";
  }
}

export class ExecutionError extends CouncilClawError {
  constructor(
    message: string,
    public readonly command: string,
    public readonly exitCode?: number,
    context?: Record<string, unknown>,
  ) {
    super(message, "EXECUTION_ERROR", { command, exitCode, ...context });
    this.name = "ExecutionError";
  }
}

export class ConfigurationError extends CouncilClawError {
  constructor(message: string, public readonly field: string, context?: Record<string, unknown>) {
    super(message, "CONFIGURATION_ERROR", { field, ...context });
    this.name = "ConfigurationError";
  }
}

export class ValidationError extends CouncilClawError {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown,
    context?: Record<string, unknown>,
  ) {
    super(message, "VALIDATION_ERROR", { field, value, ...context });
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends CouncilClawError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "AUTHENTICATION_ERROR", context);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends CouncilClawError {
  constructor(
    message: string,
    public readonly retryAfterMs?: number,
    context?: Record<string, unknown>,
  ) {
    super(message, "RATE_LIMIT_ERROR", { retryAfterMs, ...context });
    this.name = "RateLimitError";
  }
}
