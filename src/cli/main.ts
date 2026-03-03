#!/usr/bin/env node
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { randomUUID } from "node:crypto";
import { runCouncil } from "../council/council-engine.js";
import { SUPPORTED_MODELS } from "../llm/model-catalog.js";
import { CONFIG_PATH, applyConfigToEnv, ensureConfig, ensureConfigDetailed, saveConfig, validateModels, type CouncilClawSettings } from "../config/settings.js";
import { CLI_BANNER, tagline } from "./banner.js";

function printHeader(): void {
  console.log(CLI_BANNER);
  console.log(`🦀 CouncilClaw CLI | ${tagline()}`);
}

function printRisksWarning(): void {
  console.log("\n" + "=".repeat(80));
  console.log("⚠️  IMPORTANT: RISKS AND RESPONSIBILITIES");
  console.log("=".repeat(80));
  console.log(`
CouncilClaw is an LLM-powered system that:

  ▸ Executes shell commands on your system (with allowlist protection)
  ▸ Makes API calls to external LLM providers (OpenRouter, etc.)
  ▸ Processes and stores task traces locally
  ▸ Can be accessed via webhook API if server mode is enabled
  ▸ Relies on LLM outputs which may produce incorrect or harmful suggestions

SECURITY CONSIDERATIONS:
  ▸ Only allowlisted shell commands will execute
  ▸ API calls expose your OpenRouter API key to the network
  ▸ Keep your API keys secure; rotate them regularly
  ▸ Review execution traces in ${process.env.HOME}/.config/councilclaw/
  ▸ Do not run untrusted input through CouncilClaw without review
  ▸ Monitor logs (DEBUG=true) for suspicious activity

DISCLAIMERS:
  ▸ CouncilClaw is provided AS-IS without warranty
  ▸ You are responsible for all commands executed via CouncilClaw
  ▸ LLM outputs may be incorrect, biased, or misleading
  ▸ Always review council decisions before accepting them
  ▸ Do not rely on CouncilClaw for critical/sensitive operations

By accepting these terms, you agree to:
  ✓ Use CouncilClaw responsibly and securely
  ✓ Monitor and review all execution results
  ✓ Keep your API keys confidential
  ✓ Accept liability for commands executed through CouncilClaw

For security details, see: SECURITY.md
` + "=".repeat(80) + "\n");
}

async function acceptTerms(rl: readline.Interface): Promise<boolean> {
  printRisksWarning();
  
  const answer = (await rl.question("Do you accept these risks and agree to use CouncilClaw responsibly? (yes/no): ")).trim().toLowerCase();
  
  if (answer === "yes" || answer === "y") {
    console.log("\n✅ Terms accepted. Continuing setup...\n");
    return true;
  } else {
    console.log("\n❌ Setup cancelled. You did not accept the terms.");
    process.exit(1);
  }
}



function printUsage(): void {
  printHeader();
  console.log(`Usage: councilclaw [command]

Commands:
  chat                          Start interactive council chat
  models                        List built-in supported models
  configure                     Interactive setup wizard
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
  councilclaw configure
  councilclaw config init
  councilclaw config set chairman_model openai/gpt-4.1
  councilclaw config set council_models openai/gpt-4.1-mini,google/gemini-2.5-flash
`);
}

function showModelShortlist(): void {
  console.log("\nSupported models:");
  SUPPORTED_MODELS.forEach((m, i) => console.log(`  ${i + 1}. ${m.id} (${m.tier})`));
  console.log("");
}

async function ask(rl: readline.Interface, label: string, current: string): Promise<string> {
  const ans = (await rl.question(`${label} [${current}]: `)).trim();
  return ans || current;
}

async function configureWizard(): Promise<void> {
  const { config: cfg, created: isNewConfig } = await ensureConfigDetailed();
  const rl = readline.createInterface({ input, output });

  // Show terms acceptance on first configuration
  if (isNewConfig || !cfg.termsAccepted) {
    const accepted = await acceptTerms(rl);
    if (!accepted) {
      rl.close();
      return;
    }
    cfg.termsAccepted = true;
    cfg.termsAcceptedAt = new Date().toISOString();
  }

  printHeader();
  console.log("\n┌ CouncilClaw configure");
  console.log(`│ Config path: ${CONFIG_PATH}`);
  console.log("│ Press Enter to keep current value.");
  console.log("└");

  showModelShortlist();

  const next: CouncilClawSettings = { ...cfg };

  next.openRouterApiKey = await ask(rl, "OpenRouter API Key", cfg.openRouterApiKey ? "********" : "");
  if (next.openRouterApiKey === "********") next.openRouterApiKey = cfg.openRouterApiKey;

  next.openRouterBaseUrl = await ask(rl, "OpenRouter Base URL", cfg.openRouterBaseUrl);

  const chairman = await ask(rl, "Chairman Model", cfg.chairmanModel);
  next.chairmanModel = validateModels([chairman])[0] || cfg.chairmanModel;

  const councilRaw = await ask(rl, "Council Models (comma-separated)", cfg.councilModels.join(","));
  const councilParsed = validateModels(councilRaw.split(",").map((x) => x.trim()));
  next.councilModels = councilParsed.length ? councilParsed : cfg.councilModels;

  const allowedRaw = await ask(rl, "Allowed Chairman Models (comma-separated)", cfg.allowedChairmanModels.join(","));
  const allowedParsed = validateModels(allowedRaw.split(",").map((x) => x.trim()));
  next.allowedChairmanModels = allowedParsed.length ? allowedParsed : cfg.allowedChairmanModels;

  const portRaw = await ask(rl, "Server Port", String(cfg.port));
  next.port = Number(portRaw) || cfg.port;

  const tracePath = await ask(rl, "Trace Store Path", cfg.tracePath);
  next.tracePath = tracePath;

  const cmds = await ask(rl, "Allowed Shell Commands (comma-separated)", cfg.allowedShellCommands.join(","));
  next.allowedShellCommands = cmds.split(",").map((x) => x.trim()).filter(Boolean);

  const timeoutRaw = await ask(rl, "Exec Timeout (ms)", String(cfg.execTimeoutMs));
  next.execTimeoutMs = Number(timeoutRaw) || cfg.execTimeoutMs;

  next.webhookToken = await ask(rl, "Webhook Auth Token (Bearer)", cfg.webhookToken ? "********" : "");
  if (next.webhookToken === "********") next.webhookToken = cfg.webhookToken;

  const rateRaw = await ask(rl, "Rate Limit per minute", String(cfg.rateLimitPerMinute));
  next.rateLimitPerMinute = Number(rateRaw) || cfg.rateLimitPerMinute;

  // Preserve terms acceptance
  next.termsAccepted = cfg.termsAccepted;
  next.termsAcceptedAt = cfg.termsAcceptedAt;

  await saveConfig(next);
  rl.close();

  console.log("\n✅ Configuration saved.");
  console.log(`Path: ${CONFIG_PATH}`);
}

async function chatMode(): Promise<void> {
  const { config: cfg, created: isNewConfig } = await ensureConfigDetailed();
  
  // Show terms acceptance on first chat if not already accepted
  if (isNewConfig || !cfg.termsAccepted) {
    const rl = readline.createInterface({ input, output });
    const accepted = await acceptTerms(rl);
    rl.close();
    
    if (!accepted) return;
    
    cfg.termsAccepted = true;
    cfg.termsAcceptedAt = new Date().toISOString();
    await saveConfig(cfg);
  }

  applyConfigToEnv(cfg);

  printHeader();
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
    console.log(`council> ${result.chairmanPlan.rationale}`);
    console.log(`trace> chairman=${result.trace.selectedChairmanModel} taskType=${result.trace.taskType || "general"}`);
    if (result.trace.dissent) {
      console.log(`dissent> ${result.trace.dissent}`);
    }
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
      if (!validateModels([value]).length) {
        console.error(`Invalid chairman_model: '${value}'. Use 'councilclaw models' to list supported IDs.`);
        process.exit(1);
      }
      cfg.chairmanModel = value;
      break;
    case "council_models":
      cfg.councilModels = validateModels(value.split(",").map((v) => v.trim()));
      if (!cfg.councilModels.length) {
        console.error("Invalid council_models: no supported model IDs provided.");
        process.exit(1);
      }
      break;
    case "allowed_chairman_models":
      cfg.allowedChairmanModels = validateModels(value.split(",").map((v) => v.trim()));
      if (!cfg.allowedChairmanModels.length) {
        console.error("Invalid allowed_chairman_models: no supported model IDs provided.");
        process.exit(1);
      }
      break;
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

  if (cmd === "configure") return configureWizard();

  if (cmd === "models") {
    printHeader();
    SUPPORTED_MODELS.forEach((m) => {
      console.log(`${m.id} | ${m.tier} | ${m.label}`);
    });
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

  printUsage();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
