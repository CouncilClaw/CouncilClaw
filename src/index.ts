import { runCouncil } from "./council/council-engine.js";
import type { TaskEnvelope } from "./types/contracts.js";

async function main(): Promise<void> {
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

main().catch((err) => {
  console.error("CouncilClaw boot error", err);
  process.exit(1);
});
