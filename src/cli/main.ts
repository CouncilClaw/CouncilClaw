#!/usr/bin/env node
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { randomUUID } from "node:crypto";
import { runCouncil } from "../council/council-engine.js";
import { SUPPORTED_MODELS } from "../llm/model-catalog.js";
import { CONFIG_PATH, applyConfigToEnv, ensureConfig, loadConfig, saveConfig, validateModels } from "../config/settings.js";

async function chatMode(): Promise<void> {
  const cfg = await ensureConfig();
  applyConfigToEnv(cfg);

  const rl = readline.createInterface({ input, output });
  console.log("CouncilClaw CLI chat started. Type 'exit' to quit.");
  while (true) {
    const text = (await rl.question("you> ")).trim();
    if (!text || text.toLowerCase() === "exit") break;
    const result = await runCouncil({
      id: randomUUID(),
      userId: "cli-user",
      channel: "unknown",
      text,
      createdAt: new Date().toISOString(),
    });
    console.log(`council> ${result.chairmanPlan.rationale}`);
    console.log(`trace> chairman=${result.trace.selectedChairmanModel} taskType=${result.trace.taskType || "general"}`);
  }
  rl.close();
}

async function configSet(key: string, value: string): Promise<void> {
  const cfg = await ensureConfig();
  switch (key) {
    case "openrouter_api_key": cfg.openRouterApiKey = value; break;
    case "chairman_model": cfg.chairmanModel = value; break;
    case "council_models": cfg.councilModels = validateModels(value.split(",").map((v) => v.trim())); break;
    case "allowed_chairman_models": cfg.allowedChairmanModels = validateModels(value.split(",").map((v) => v.trim())); break;
    default:
      console.error("Unknown key");
      process.exit(1);
  }
  await saveConfig(cfg);
  console.log(`Updated ${key} in ${CONFIG_PATH}`);
}

async function main(): Promise<void> {
  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd || cmd === "chat") return chatMode();
  if (cmd === "models") {
    SUPPORTED_MODELS.forEach((m) => console.log(`${m.id} | ${m.tier} | ${m.label}`));
    return;
  }
  if (cmd === "config") {
    const sub = args[0];
    if (sub === "init") {
      await ensureConfig();
      console.log(`Config initialized: ${CONFIG_PATH}`);
      return;
    }
    if (sub === "show") {
      console.log(JSON.stringify(await ensureConfig(), null, 2));
      return;
    }
    if (sub === "set") {
      const [k, ...rest] = args.slice(1);
      await configSet(k, rest.join(" "));
      return;
    }
  }

  console.log("Usage:");
  console.log("  councilclaw chat");
  console.log("  councilclaw models");
  console.log("  councilclaw config init|show");
  console.log("  councilclaw config set <openrouter_api_key|chairman_model|council_models|allowed_chairman_models> <value>");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
