import { runCouncil } from "./council/council-engine.js";
import { startWebhookServer } from "./api/webhook.js";
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
