#!/usr/bin/env node
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { randomUUID } from "node:crypto";
import { runCouncil } from "../council/council-engine.js";
import { SUPPORTED_MODELS } from "../llm/model-catalog.js";
import { CONFIG_PATH, applyConfigToEnv, ensureConfig, saveConfig, validateModels } from "../config/settings.js";
import { CLI_BANNER, tagline } from "./banner.js";

function printHeader(): void {
  // eslint-disable-next-line no-console
  console.log(CLI_BANNER);
  // eslint-disable-next-line no-console
  console.log(`🦀 CouncilClaw CLI | ${tagline()}`);
}

function printUsage(): void {
  printHeader();
  // eslint-disable-next-line no-console
  console.log(`Usage: councilclaw [command]

Commands:
  chat                          Start interactive council chat
  models                        List built-in supported models
  config init                   Create config at ${CONFIG_PATH}
  config show                   Print current config
  config set <key> <value>      Update config value

Config keys:
  openrouter_api_key
  chairman_model
  council_models                Comma-separated model IDs
  allowed_chairman_models       Comma-separated model IDs

Examples:
  councilclaw chat
  councilclaw models
  councilclaw config init
  councilclaw config set chairman_model openai/gpt-4.1
  councilclaw config set council_models openai/gpt-4.1-mini,google/gemini-2.5-flash
`);
}

async function chatMode(): Promise<void> {
  const cfg = await ensureConfig();
  applyConfigToEnv(cfg);

  printHeader();
  // eslint-disable-next-line no-console
  console.log("Type 'exit' to quit. Use '/chairman <model>' inline to request a chairman override.\n");

  const rl = readline.createInterface({ input, output });
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
    // eslint-disable-next-line no-console
    console.log(`council> ${result.chairmanPlan.rationale}`);
    // eslint-disable-next-line no-console
    console.log(`trace> chairman=${result.trace.selectedChairmanModel} taskType=${result.trace.taskType || "general"}`);
    if (result.trace.dissent) {
      // eslint-disable-next-line no-console
      console.log(`dissent> ${result.trace.dissent}`);
    }
    // eslint-disable-next-line no-console
    console.log("");
  }
  rl.close();
}

async function configSet(key: string, value: string): Promise<void> {
  const cfg = await ensureConfig();
  switch (key) {
    case "openrouter_api_key":
      cfg.openRouterApiKey = value;
      break;
    case "chairman_model":
      cfg.chairmanModel = value;
      break;
    case "council_models":
      cfg.councilModels = validateModels(value.split(",").map((v) => v.trim()));
      break;
    case "allowed_chairman_models":
      cfg.allowedChairmanModels = validateModels(value.split(",").map((v) => v.trim()));
      break;
    default:
      // eslint-disable-next-line no-console
      console.error("Unknown key");
      process.exit(1);
  }
  await saveConfig(cfg);
  // eslint-disable-next-line no-console
  console.log(`Updated ${key} in ${CONFIG_PATH}`);
}

async function main(): Promise<void> {
  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd || cmd === "chat") return chatMode();

  if (cmd === "models") {
    printHeader();
    SUPPORTED_MODELS.forEach((m) => {
      // eslint-disable-next-line no-console
      console.log(`${m.id} | ${m.tier} | ${m.label}`);
    });
    return;
  }

  if (cmd === "config") {
    const sub = args[0];
    if (sub === "init") {
      await ensureConfig();
      // eslint-disable-next-line no-console
      console.log(`Config initialized: ${CONFIG_PATH}`);
      return;
    }
    if (sub === "show") {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(await ensureConfig(), null, 2));
      return;
    }
    if (sub === "set") {
      const [k, ...rest] = args.slice(1);
      await configSet(k, rest.join(" "));
      return;
    }
  }

  printUsage();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
