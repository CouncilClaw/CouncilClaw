#!/usr/bin/env node
import readline from "node:readline/promises";
import { cursorTo, clearScreenDown } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { randomUUID } from "node:crypto";
import { runCouncil } from "../council/council-engine.js";
import { SUPPORTED_MODELS, MAX_COUNCIL_MODELS, MIN_COUNCIL_MODELS } from "../llm/model-catalog.js";
import { CONFIG_PATH, DEFAULT_SETTINGS, applyConfigToEnv, ensureConfig, ensureConfigDetailed, saveConfig, validateModels, type CouncilClawSettings } from "../config/settings.js";
import { CLI_BANNER, tagline } from "./banner.js";
import { selectFromList, selectModelsHierarchically, selectChannel } from "./menu-helpers.js";
import { initializeMemoryStore } from "../memory/index.js";

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

  ▸ Executes shell commands on your system (with blocklist protection)
  ▸ Makes API calls to external LLM providers (OpenRouter, etc.)
  ▸ Processes and stores task traces locally
  ▸ Can be accessed via webhook API if server mode is enabled
  ▸ Relies on LLM outputs which may produce incorrect or harmful suggestions

SECURITY CONSIDERATIONS:
  ▸ Dangerous shell commands are blocked by a safety policy
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




async function syncTelegramCommandsFromConfig(): Promise<void> {
  const cfg = await ensureConfig();
  const tcfg = cfg.channelConfigs.telegram;
  const token = tcfg?.token?.trim();

  if (!token) {
    console.error("❌ Telegram token not set. Run npm run setup and configure Telegram channel first.");
    process.exit(1);
  }

  const test = await testChannelConnection("telegram", token, cfg.telegramCommands);
  if (!test.ok) {
    console.error(`❌ Telegram sync failed: ${test.message}`);
    process.exit(1);
  }

  console.log("✅ Telegram commands synced successfully.");
  console.log(`Commands: ${cfg.telegramCommands.join(", ")}`);
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
  npm run cli -- telegram sync-commands  Force register Telegram slash commands
  npm run cli -- telegram show-commands  Show configured Telegram commands

📝 Configuration Examples:
  npm run cli -- config set openrouter_api_key YOUR_API_KEY
  npm run cli -- config set chairman_model openai/gpt-4o
  npm run cli -- config set council_models openai/gpt-4o-mini,google/gemini-2.0-flash,anthropic/claude-3.5-sonnet

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

function printConfigSummary(cfg: CouncilClawSettings): void {
  const models = cfg.councilModels.length > 0 ? cfg.councilModels.join(", ") : "None";
  const chairman = cfg.chairmanModel || "None";
  const channels = Object.entries(cfg.channelConfigs)
    .filter(([_, c]) => c.enabled)
    .map(([id]) => id)
    .join(", ");

  console.log("\n◇  Existing config detected ──────────╮");
  console.log(`│                                     │`);
  console.log(`│  Config path: ${CONFIG_PATH.replace(process.env.HOME || "", "~")}`);
  console.log(`│  API Base: ${cfg.openRouterBaseUrl}      `);
  console.log(`│  Council: ${cfg.councilModels.length} models (${cfg.councilModels[0]?.slice(0, 15)}...)`);
  console.log(`│  Chairman: ${chairman}                `);
  console.log(`│  Default Channel: ${cfg.defaultChannel}    `);
  console.log(`│  Active Channels: ${channels || "CLI only"} `);
  console.log(`│                                     │`);
  console.log("├─────────────────────────────────────╯");
}

async function configureWizard(): Promise<void> {
  const { config: cfg, created: isNewConfig } = await ensureConfigDetailed();
  const rl = readline.createInterface({ input, output });
  const detachSigint = cleanupOnSigint(rl, "Goodbye.");

  // Show terms acceptance on first configuration
  if (isNewConfig || !cfg.termsAccepted) {
    const accepted = await acceptTerms(rl);
    if (!accepted) {
      detachSigint();
      rl.close();
      return;
    }
    cfg.termsAccepted = true;
    cfg.termsAcceptedAt = new Date().toISOString();
  }

  printHeader();

  if (isNewConfig) {
    console.log("\n🚀 Welcome to CouncilClaw! Let's get you set up.");
    await runOnboarding(rl, cfg);
  } else {
    printConfigSummary(cfg);
    await runReconfiguration(rl, cfg);
  }

  detachSigint();
  rl.close();
}

async function runOnboarding(rl: readline.Interface, cfg: CouncilClawSettings): Promise<void> {
  console.log("\n--- [1/2] API Configuration ---");
  cfg.openRouterApiKey = await ask(rl, "OpenRouter API Key", "");
  
  console.log("\n--- [2/2] Model Selection ---");
  cfg.councilModels = await selectModelsHierarchically(rl, "Select Initial Council Models", []);
  if (cfg.councilModels.length > 0) {
    cfg.chairmanModel = cfg.councilModels[0];
    cfg.allowedChairmanModels = [...cfg.councilModels];
  }

  await saveConfig(cfg);
  console.log("\n✅ Onboarding complete! Use 'npm run setup' again to customize further.");
}

async function testChannelConnection(channelId: string, token: string, commands?: string[]): Promise<{ ok: boolean; message: string }> {
  if (channelId === "telegram") {
    try {
      // Test connection with getMe
      const resp = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await resp.json() as any;
      if (!data.ok) {
        return { ok: false, message: data.description || "Invalid token" };
      }

      // Register commands if provided (or use defaults)
      const cmdsToRegister = commands && commands.length > 0 ? commands : DEFAULT_SETTINGS.telegramCommands;
      
      if (cmdsToRegister && cmdsToRegister.length > 0) {
        try {
          const commandObjects = cmdsToRegister.map((cmd) => ({
            command: cmd.replace(/^\//, ""), // Remove leading slash
            description: `CouncilClaw ${cmd} command`,
          }));

          console.log(`  📋 Registering ${commandObjects.length} commands...`);
          const cmdResp = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commands: commandObjects }),
          });
          const cmdData = await cmdResp.json() as any;
          if (!cmdData.ok) {
            console.warn(`  ⚠️  Commands registration failed: ${cmdData.description}`);
          } else {
            console.log(`  ✓ Commands registered in Telegram bot menu`);
          }
        } catch (cmdErr: any) {
          console.warn(`  ⚠️  Could not register commands: ${cmdErr.message}`);
        }
      }

      return { ok: true, message: `Connected! Logged in as @${data.result.username}` };
    } catch (err: any) {
      return { ok: false, message: `Network error: ${err.message}` };
    }
  }
  // Add other channel tests here
  return { ok: true, message: "Configuration saved (test skipped for this channel)." };
}

function maskToken(token: string | undefined): string {
  if (!token) return "";
  if (token.length <= 4) return "****";
  return "********" + token.slice(-4);
}

async function runReconfiguration(rl: readline.Interface, cfg: CouncilClawSettings): Promise<void> {
  const sections = [
    "API & Workspace",
    "Model Council",
    "Channels",
    "System & Safety",
    "Done & Exit"
  ];

  const drawHeader = () => {
    printHeader();
    printConfigSummary(cfg);
  };

  while (true) {
    const choiceIdx = await selectFromList(rl, "Select sections to configure", sections, undefined, drawHeader);
    const section = sections.find((_, i) => sections[i] === choiceIdx);

    if (section === "Done & Exit" || !section) break;

    try {
      if (section === "API & Workspace") {
        cfg.openRouterApiKey = await ask(rl, "OpenRouter API Key", cfg.openRouterApiKey ? "********" : "");
        if (cfg.openRouterApiKey === "********") {
           const current = await ensureConfig();
           cfg.openRouterApiKey = current.openRouterApiKey;
        }
        cfg.openRouterBaseUrl = await ask(rl, "OpenRouter Base URL", cfg.openRouterBaseUrl);
      } 
      else if (section === "Model Council") {
        cfg.councilModels = await selectModelsHierarchically(rl, "Configure Council Models", cfg.councilModels, drawHeader);
        if (cfg.councilModels.length > 0) {
          const currentChairman = cfg.councilModels.includes(cfg.chairmanModel) ? cfg.chairmanModel : cfg.councilModels[0];
          cfg.chairmanModel = await selectFromList(rl, "Select Primary Chairman Model", cfg.councilModels, currentChairman, drawHeader);
          cfg.allowedChairmanModels = [...cfg.councilModels];
        }
      } 
      else if (section === "Channels") {
        const selectedChannelId = await selectChannel(rl, cfg.defaultChannel, drawHeader);
        if (selectedChannelId === "back") continue;
        
        cfg.defaultChannel = selectedChannelId;
        
        if (selectedChannelId !== "cli") {
          console.log(`\nConfiguring ${selectedChannelId} channel...`);
          const chanCfg = cfg.channelConfigs[selectedChannelId] || { enabled: true };
          
          let shouldUpdate = true;
          if (chanCfg.token) {
            console.log(`\nConnected account detected: ${maskToken(chanCfg.token)}`);
            const change = (await rl.question("Do you want to change this connection? (y/N): ")).trim().toLowerCase();
            if (change !== "y" && change !== "yes") {
              shouldUpdate = false;
            }
          }

          if (shouldUpdate) {
            chanCfg.enabled = true;
            if (["slack", "discord", "telegram", "whatsapp"].includes(selectedChannelId)) {
              const currentToken = chanCfg.token || "";
              const displayToken = currentToken ? maskToken(currentToken) : "";
              
              const newToken = await ask(rl, `${selectedChannelId.toUpperCase()} Token/API Key`, displayToken);
              
              if (newToken === displayToken) {
                // Keep existing
              } else {
                chanCfg.token = newToken;
              }
            }
            
            // Connection Test
            if (chanCfg.token) {
              console.log(`\nTesting ${selectedChannelId} connection...`);
              const commandsToUse = selectedChannelId === "telegram" ? cfg.telegramCommands : undefined;
              const test = await testChannelConnection(selectedChannelId, chanCfg.token, commandsToUse);
              if (test.ok) {
                console.log(`✅ ${test.message}`);
                console.log(`You can now interact with CouncilClaw on ${selectedChannelId}.`);
              } else {
                console.error(`❌ Connection failed: ${test.message}`);
                const retry = (await rl.question("Keep this configuration anyway? (y/N): ")).trim().toLowerCase();
                if (retry !== "y" && retry !== "yes") {
                   console.log("Reverting channel changes.");
                   const current = await ensureConfig();
                   cfg.channelConfigs[selectedChannelId] = current.channelConfigs[selectedChannelId];
                   continue;
                }
              }
            }
            
            cfg.channelConfigs[selectedChannelId] = chanCfg;
          }
        }
      } 
      else if (section === "System & Safety") {
        const portRaw = await ask(rl, "Server Port", String(cfg.port));
        cfg.port = Number(portRaw) || cfg.port;

        const blockedRaw = await ask(rl, "Blocked Shell Commands", cfg.blockedShellCommands.join(","));
        cfg.blockedShellCommands = blockedRaw.split(",").map((x) => x.trim()).filter(Boolean);

        const telegramCmdsRaw = await ask(rl, "Telegram Bot Commands", cfg.telegramCommands.join(","));
        cfg.telegramCommands = telegramCmdsRaw.split(",").map((x) => x.trim()).filter(Boolean);
      }

      await saveConfig(cfg);
      console.log(`\n✅ ${section} updated. Press Enter to continue...`);
      await rl.question("");
    } catch (err: any) {
      console.error(`\n❌ Error updating ${section}: ${err.message || String(err)}`);
      console.log("Press Enter to continue...");
      await rl.question("");
    }
  }

  console.log("\n✅ Configuration saved.");
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
      if (parsed.length > MAX_COUNCIL_MODELS) {
        console.error(`Invalid council_models: maximum ${MAX_COUNCIL_MODELS} models allowed. You provided ${parsed.length}.`);
        process.exit(1);
      }
      cfg.councilModels = parsed;
      cfg.allowedChairmanModels = [...parsed];
      console.log(`✅ Council models set to ${parsed.length} models: ${parsed.join(", ")}`);
      break;
    case "blocked_shell_commands":
      cfg.blockedShellCommands = value.split(",").map(v => v.trim()).filter(Boolean);
      console.log(`✅ Blocked commands updated: ${cfg.blockedShellCommands.join(", ")}`);
      break;
    case "telegram_commands":
      cfg.telegramCommands = value.split(",").map(v => v.trim()).filter(Boolean);
      console.log(`✅ Telegram commands updated: ${cfg.telegramCommands.join(", ")}`);
      break;
    default:
      console.error("Unknown key");
      process.exit(1);
  }
  await saveConfig(cfg);
  console.log(`Updated ${key} in ${CONFIG_PATH}`);
}

async function main(): Promise<void> {
  // Initialize memory system
  try {
    await initializeMemoryStore();
  } catch (error) {
    console.warn("Warning: Memory system initialization failed. Continuing without memory.", error);
  }

  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd || cmd === "chat") return chatMode();

  if (cmd === "configure") return configureWizard();

  if (cmd === "models") {
    printHeader();
    showModelShortlist();
    console.log(`📊 Model Statistics:`);
    console.log(`  Total available: ${SUPPORTED_MODELS.length}`);
    console.log(`  Council size: up to ${MAX_COUNCIL_MODELS} models`);
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


  if (cmd === "telegram") {
    const sub = args[0];
    if (sub === "sync-commands") {
      await syncTelegramCommandsFromConfig();
      return;
    }
    if (sub === "show-commands") {
      const cfg = await ensureConfig();
      console.log(cfg.telegramCommands.join("\n"));
      return;
    }
    console.log("Usage: npm run cli -- telegram <sync-commands|show-commands>");
    return;
  }

  if (cmd === "help" || cmd === "--help" || cmd === "-h") {
    printUsage();
    return;
  }

  // Unknown command - show usage
  printUsage();
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`\n❌ Fatal Error: ${msg}`);
  if (process.env.DEBUG === "true" && e instanceof Error && e.stack) {
    console.error(e.stack);
  }
  process.exit(1);
});
