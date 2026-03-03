import { ConfigurationError } from "../errors/index.js";
import { RuntimeEnvSchema, type ValidatedRuntimeEnv } from "../validation/schemas.js";

export type RuntimeEnv = ValidatedRuntimeEnv;

function intEnv(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function getEnv(): RuntimeEnv {
  const raw = {
    openRouterApiKey: process.env.OPENROUTER_API_KEY?.trim(),
    openRouterBaseUrl: process.env.OPENROUTER_BASE_URL?.trim(),
    openRouterMaxRetries: intEnv(process.env.OPENROUTER_MAX_RETRIES, 2),
    openRouterRetryBaseMs: intEnv(process.env.OPENROUTER_RETRY_BASE_MS, 500),
    traceStorePath: process.env.COUNCIL_TRACE_PATH?.trim(),
    councilClawMode: process.env.COUNCILCLAW_MODE?.trim(),
    debugMode: process.env.DEBUG === "true",
  };

  try {
    return RuntimeEnvSchema.parse(raw);
  } catch (error) {
    throw new ConfigurationError(
      `Environment configuration is invalid: ${error instanceof Error ? error.message : String(error)}`,
      "environment",
      { originalError: error },
    );
  }
}
