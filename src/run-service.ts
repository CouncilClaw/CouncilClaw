/**
 * CouncilClaw service: webhook API + Telegram (and other channels).
 * Used by the default entrypoint (index) and by `councilclaw start`.
 * No side effects on load—only when runService() is called.
 */

import { startWebhookServer } from "./api/webhook.js";
import { applyConfigToEnv, ensureConfig } from "./config/settings.js";
import { runTelegramPolling } from "./channels/telegram-bot.js";
import { initializeMemoryStore } from "./memory/index.js";

/**
 * Run the CouncilClaw service: webhook API + Telegram (and other channels).
 * Does not return; use for "always on" / startup behavior (OpenClaw-style).
 */
export async function runService(): Promise<void> {
  const cfg = await ensureConfig();
  applyConfigToEnv(cfg);

  try {
    await initializeMemoryStore();
  } catch (error) {
    console.warn("Warning: Memory system initialization failed. Continuing without memory.", error);
  }

  startWebhookServer();
  runTelegramPolling(cfg).catch((err) => {
    console.error("Telegram polling error:", err);
  });
}
