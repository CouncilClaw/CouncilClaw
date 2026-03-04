#!/usr/bin/env node
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { randomUUID } from "node:crypto";
import { runCouncil } from "../council/council-engine.js";
import { SUPPORTED_MODELS, MAX_COUNCIL_MODELS, MIN_COUNCIL_MODELS } from "../llm/model-catalog.js";
import { CONFIG_PATH, applyConfigToEnv, ensureConfig, ensureConfigDetailed, saveConfig, validateModels, type CouncilClawSettings } from "../config/settings.js";
import { CLI_BANNER, tagline } from "./banner.js";
import { selectFromList, selectMultipleModels, selectChannel } from "./menu-helpers.js";

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

function cleanupOnSigint(rl: readline.Interface, message: string): () => void {
  const handler = (): void => {
    console.log(`\n${message}`);
    rl.close();
    process.exit(0);
  };
  process.once("SIGINT", handler);
  return () => process.off("SIGINT", handler);
}

function resolveChatAnswer(rationale: string | undefined): { ok: boolean; text: string; reason?: string } {
  const msg = rationale?.trim() || "";
  if (!msg) {
    return { ok: false, text: "", reason: "Chairman returned an empty rationale." };
  }
  if (/model error|no content|failed/i.test(msg)) {
    return { ok: false, text: msg, reason: "Chairman synthesis did not produce a usable answer." };
  }
  return { ok: true, text: msg };
}



function printUsage(): void {
  printHeader();
  console.log(`Usage: npm run <script|cli command>

🚀 Quick Start Aliases (Recommended):
  npm run setup                 Interactive configuration wizard ⭐ Start here
  npm run chat                  Start interactive council chat
  npm run models                List 37 supported models by provider

🔧 Manual CLI Commands:
  npm run cli -- chat           Start interactive council chat
  npm run cli -- configure      Interactive configuration wizard
  npm run cli -- models         List supported models
  npm run cli -- config init    Create config file
  npm run cli -- config show    Display current configuration
  npm run cli -- config set ... Update configuration

📝 Configuration Examples:
  npm run cli -- config set openrouter_api_key YOUR_API_KEY
  npm run cli -- config set chairman_model openai/gpt-4o
  npm run cli -- config set council_models openai/gpt-4o-mini,google/gemini-2.0-flash,anthropic/claude-3.5-sonnet
  npm run cli -- config set allowed_chairman_models openai/gpt-4o,google/gemini-2.0-flash

📍 Config File: ${CONFIG_PATH}

💡 Tip: Use 'npm run setup' on first install for interactive guided setup!
`);
}

function showModelShortlist(): void {
  console.log(`\nAvailable Models (Recommended: ${MIN_COUNCIL_MODELS}-${MAX_COUNCIL_MODELS} per council):`);
  
  // Group by provider
  const modelsByProvider = new Map<string, typeof SUPPORTED_MODELS>();
  SUPPORTED_MODELS.forEach((m) => {
    if (!modelsByProvider.has(m.provider)) {
      modelsByProvider.set(m.provider, []);
    }
    modelsByProvider.get(m.provider)!.push(m);
  });

  // Display grouped by provider
  modelsByProvider.forEach((models, provider) => {
    console.log(`\n  ${provider}:`);
    models.forEach((m) => {
      console.log(`    • ${m.id.padEnd(35)} | ${m.label.padEnd(20)} | [${m.tier}]`);
    });
  });

  console.log(`\n  Tip: Use ${MAX_COUNCIL_MODELS} or fewer models for optimal performance`);
  console.log("");
}

async function ask(rl: readline.Interface, label: string, current: string): Promise<string> {
  const ans = (await rl.question(`${label} [${current}]: `)).trim();
  return ans || current;
}

async function configureWizard(): Promise<void> {
  const { config: cfg, created: isNewConfig } = await ensureConfigDetailed();
  const rl = readline.createInterface({ input, output });
  const detachSigint = cleanupOnSigint(rl, "Goodbye.");

  // Show terms acceptance on first configuration (or if not accepted yet)
  if (isNewConfig || !cfg.termsAccepted) {
    const accepted = await acceptTerms(rl);
    if (!accepted) {
      detachSigint();
      rl.close();
      return;
    }
    cfg.termsAccepted = true;
    cfg.termsAcceptedAt = new Date().toISOString();
  } else {
    const reviewTerms = (await rl.question("Review and re-accept risk terms now? (y/N): ")).trim().toLowerCase();
    if (reviewTerms === "y" || reviewTerms === "yes") {
      const accepted = await acceptTerms(rl);
      if (!accepted) {
        detachSigint();
        rl.close();
        return;
      }
      cfg.termsAccepted = true;
      cfg.termsAcceptedAt = new Date().toISOString();
    }
  }

  printHeader();
  console.log("\n┌ CouncilClaw configure");
  console.log(`│ Config path: ${CONFIG_PATH}`);
  console.log("│ Press Enter to keep current value.");
  console.log("└");

  showModelShortlist();

  const next: CouncilClawSettings = { ...cfg };

  next.openRouterApiKey = await ask(rl, "OpenRouter API Key", cfg.openRouterApiKey ? "********" : "");
  if (next.openRouterApiKey === "********") {
    next.openRouterApiKey = cfg.openRouterApiKey;
  } else if (!next.openRouterApiKey || next.openRouterApiKey.trim() === "") {
    console.log("ℹ️  No API key configured. Chat will run in local stub mode until you add one.");
    next.openRouterApiKey = "";
  }

  next.openRouterBaseUrl = await ask(rl, "OpenRouter Base URL", cfg.openRouterBaseUrl);
  if (!next.openRouterBaseUrl.trim()) {
    next.openRouterBaseUrl = "https://openrouter.ai/api/v1";
    console.log("ℹ️  Empty base URL replaced with default: https://openrouter.ai/api/v1");
  }

  // Interactive council model selection (keyboard selection)
  next.councilModels = await selectMultipleModels(rl, "Select Council Models", MIN_COUNCIL_MODELS, MAX_COUNCIL_MODELS, cfg.councilModels);

  // Chairman selection constrained to selected council models.
  const currentChairman = next.councilModels.includes(cfg.chairmanModel) ? cfg.chairmanModel : next.councilModels[0];
  next.chairmanModel = await selectFromList(rl, "Select Chairman Model", next.councilModels, currentChairman);
  if (!next.councilModels.includes(next.chairmanModel)) {
    next.chairmanModel = currentChairman;
  }

  const allowedRaw = await ask(rl, `Allowed Chairman Models [max ${MAX_COUNCIL_MODELS}] (comma-separated)`, cfg.allowedChairmanModels.join(","));
  const allowedParsed = validateModels(allowedRaw.split(",").map((x) => x.trim()));
  
  if (allowedParsed.length > MAX_COUNCIL_MODELS) {
    console.log(`⚠️  Maximum ${MAX_COUNCIL_MODELS} models allowed. Using first ${MAX_COUNCIL_MODELS}.`);
    next.allowedChairmanModels = allowedParsed.slice(0, MAX_COUNCIL_MODELS);
  } else if (allowedParsed.length > 0) {
    next.allowedChairmanModels = allowedParsed;
  } else {
    console.log("⚠️  Using current value.");
    next.allowedChairmanModels = cfg.allowedChairmanModels;
  }

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

  // Interactive channel selection
  next.defaultChannel = await selectChannel(rl, cfg.defaultChannel);

  const rateRaw = await ask(rl, "Rate Limit per minute", String(cfg.rateLimitPerMinute));
  next.rateLimitPerMinute = Number(rateRaw) || cfg.rateLimitPerMinute;

  // Preserve terms acceptance
  next.termsAccepted = cfg.termsAccepted;
  next.termsAcceptedAt = cfg.termsAcceptedAt;

  await saveConfig(next);
  detachSigint();
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
  if (!cfg.openRouterApiKey?.trim()) {
    console.log("ℹ️  Running without OPENROUTER_API_KEY. Responses may be stubbed/local only.");
  }
  console.log("Type 'exit' to quit. Use '/chairman <model>' inline to request a chairman override.\n");

  const rl = readline.createInterface({ input, output });
  const detachSigint = cleanupOnSigint(rl, "Goodbye.");

  while (true) {
    let text = "";
    try {
      text = (await rl.question("you> ")).trim();
    } catch {
      console.log("\nGoodbye.");
      break;
    }
    if (!text || text.toLowerCase() === "exit") break;
    
    try {
      const result = await runCouncil({
        id: randomUUID(),
        userId: "cli-user",
        channel: "unknown",
        text,
        createdAt: new Date().toISOString(),
      });

      const answer = resolveChatAnswer(result.chairmanPlan.rationale);
      const chairmanUsed = result.chairmanPlan.chairmanModel || result.trace.selectedChairmanModel;

      if (answer.ok) {
        console.log(`\n📋 ${chairmanUsed}:`);
        console.log(`   ${answer.text}`);
      } else {
        console.log(`\n⚠️  No answer from ${chairmanUsed}.`);
        if (answer.reason) console.log(`   Reason: ${answer.reason}`);
        if (answer.text) console.log(`   Details: ${answer.text}`);
      }
      
      // Show timing and metadata
      const timing = result.trace.timing;
      if (timing) {
        console.log(`\n⏱️  ${timing.totalMs}ms (decomp: ${timing.decompositionMs}ms | first: ${timing.firstPassMs}ms | review: ${timing.reviewMs}ms | synthesis: ${timing.synthesisMs}ms)`);
      }
      
      // Show dissent if any
      if (result.trace.dissent) {
        console.log(`\n💭 Dissent: ${result.trace.dissent}`);
      }
      
      console.log("");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.log(`\n❌ Error: ${errorMsg}\n`);
    }
  }
  detachSigint();
  rl.close();
}

async function configSet(key: string, value: string): Promise<void> {
  const cfg = await ensureConfig();
  switch (key) {
    case "openrouter_api_key":
      if (!value || value.trim() === "") {
        console.error("Error: OpenRouter API key cannot be empty.");
        process.exit(1);
      }
      cfg.openRouterApiKey = value;
      console.log(`✅ API key updated.`);
      break;
    case "chairman_model":
      if (!validateModels([value]).length) {
        console.error(`Invalid chairman_model: '${value}'. Use 'councilclaw models' to list supported IDs.`);
        process.exit(1);
      }
      cfg.chairmanModel = value;
      break;
    case "council_models":
      const parsed = validateModels(value.split(",").map((v) => v.trim()));
      if (!parsed.length) {
        console.error("Invalid council_models: no supported model IDs provided.");
        process.exit(1);
      }
      if (parsed.length < MIN_COUNCIL_MODELS) {
        console.error(`Invalid council_models: minimum ${MIN_COUNCIL_MODELS} model required.`);
        process.exit(1);
      }
      if (parsed.length > MAX_COUNCIL_MODELS) {
        console.error(`Invalid council_models: maximum ${MAX_COUNCIL_MODELS} models allowed. You provided ${parsed.length}.`);
        process.exit(1);
      }
      cfg.councilModels = parsed;
      console.log(`✅ Council models set to ${parsed.length} models: ${parsed.join(", ")}`);
      break;
    case "allowed_chairman_models":
      const allowedParsed = validateModels(value.split(",").map((v) => v.trim()));
      if (!allowedParsed.length) {
        console.error("Invalid allowed_chairman_models: no supported model IDs provided.");
        process.exit(1);
      }
      if (allowedParsed.length > MAX_COUNCIL_MODELS) {
        console.error(`Invalid allowed_chairman_models: maximum ${MAX_COUNCIL_MODELS} models allowed. You provided ${allowedParsed.length}.`);
        process.exit(1);
      }
      cfg.allowedChairmanModels = allowedParsed;
      console.log(`✅ Allowed chairman models set to ${allowedParsed.length} models: ${allowedParsed.join(", ")}`);
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
    showModelShortlist();
    console.log(`📊 Model Statistics:`);
    console.log(`  Total available: ${SUPPORTED_MODELS.length}`);
    console.log(`  Council size: ${MIN_COUNCIL_MODELS}-${MAX_COUNCIL_MODELS} models`);
    console.log(`  Providers: ${new Set(SUPPORTED_MODELS.map((m) => m.provider)).size}`);
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

  if (cmd === "help" || cmd === "--help" || cmd === "-h") {
    printUsage();
    return;
  }

  // Unknown command - show usage
  printUsage();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
