export const ENV = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY?.trim(),
  openRouterBaseUrl: process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1",
  openRouterMaxRetries: Number(process.env.OPENROUTER_MAX_RETRIES || 2),
  openRouterRetryBaseMs: Number(process.env.OPENROUTER_RETRY_BASE_MS || 500),
  traceStorePath: process.env.COUNCIL_TRACE_PATH?.trim() || "data/council-traces.jsonl",
};
