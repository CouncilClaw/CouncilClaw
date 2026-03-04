import { runCouncil } from "./council/council-engine.js";
import { startWebhookServer } from "./api/webhook.js";
import { applyConfigToEnv, ensureConfig } from "./config/settings.js";
import { initializeMemoryStore } from "./memory/index.js";
import type { TaskEnvelope } from "./types/contracts.js";

async function runDemo(): Promise<void> {
  const task: TaskEnvelope = {
    id: "demo-1",
    userId: "local",
    channel: "unknown",
    text: "Implement parser and tests, then package release notes.",
    createdAt: new Date().toISOString(),
    options: {
      chairmanModel: process.env.CHAIRMAN_OVERRIDE || undefined,
    },
  };

  const result = await runCouncil(task);
  console.log(JSON.stringify(result, null, 2));
}

async function main(): Promise<void> {
  const cfg = await ensureConfig();
  applyConfigToEnv(cfg);

  // Initialize memory system
  try {
    await initializeMemoryStore();
  } catch (error) {
    console.warn("Warning: Memory system initialization failed. Continuing without memory.", error);
  }

  if (process.env.COUNCILCLAW_MODE === "server") {
    startWebhookServer();
    return;
  }

  await runDemo();
}

main().catch((err) => {
  console.error("CouncilClaw boot error", err);
  process.exit(1);
});
