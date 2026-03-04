import { emitKeypressEvents } from "node:readline";
import type { Interface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { SUPPORTED_MODELS, type SupportedModel } from "../llm/model-catalog.js";

type Cleanup = () => void;

function clearScreen(): void {
  output.write("\x1b[2J\x1b[H");
}

function setupRawInput(onKey: (str: string, key: { name?: string; sequence?: string; ctrl?: boolean }) => void): Cleanup {
  emitKeypressEvents(input);
  if (input.isTTY) input.setRawMode(true);
  input.on("keypress", onKey);

  return () => {
    input.off("keypress", onKey);
    if (input.isTTY) input.setRawMode(false);
  };
}

function groupedModels(): Array<{ provider: string; items: SupportedModel[] }> {
  const map = new Map<string, SupportedModel[]>();
  for (const model of SUPPORTED_MODELS) {
    if (!map.has(model.provider)) map.set(model.provider, []);
    map.get(model.provider)?.push(model);
  }
  return [...map.entries()].map(([provider, items]) => ({ provider, items }));
}

async function waitForSingleChoice(
  label: string,
  options: string[],
  currentIndex: number,
): Promise<number> {
  return new Promise((resolve) => {
    let cursor = Math.max(0, Math.min(options.length - 1, currentIndex));

    const render = (): void => {
      clearScreen();
      console.log(`◇  ${label}`);
      console.log("   Use ↑/↓ to move, Enter to confirm.\n");
      options.forEach((opt, i) => {
        const marker = i === cursor ? "●" : "○";
        console.log(`  ${marker} ${opt}`);
      });
    };

    const done = (idx: number): void => {
      cleanup();
      console.log("");
      resolve(idx);
    };

    const onKey = (_str: string, key: { name?: string; ctrl?: boolean }): void => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.stdout.write("\nGoodbye.\n");
        process.exit(0);
      }
      if (key.name === "up") {
        cursor = (cursor - 1 + options.length) % options.length;
        render();
        return;
      }
      if (key.name === "down") {
        cursor = (cursor + 1) % options.length;
        render();
        return;
      }
      if (key.name === "return") {
        done(cursor);
      }
    };

    const cleanup = setupRawInput(onKey);
    render();
  });
}

async function waitForProviderModelsSelection(
  provider: string,
  models: SupportedModel[],
  currentlySelected: Set<string>,
): Promise<Set<string>> {
  return new Promise((resolve) => {
    let cursor = 0;
    const options = [...models.map(m => m.id), "Done"];
    const localSelected = new Set(currentlySelected);

    const render = (): void => {
      clearScreen();
      console.log(`◇  Select ${provider} Models`);
      console.log("   Use ↑/↓ to move, Space to toggle, Enter to confirm individual or 'Done' to save.\n");
      
      options.forEach((opt, i) => {
        if (opt === "Done") {
          const marker = i === cursor ? ">" : " ";
          console.log(`  ${marker} [Done]`);
        } else {
          const model = models[i];
          const focused = i === cursor ? ">" : " ";
          const mark = localSelected.has(opt) ? "x" : " ";
          console.log(`  ${focused} [${mark}] ${model.id.padEnd(40)} | ${model.label} [${model.tier}]`);
        }
      });
    };

    const onKey = (_str: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit(0);
      }
      if (key.name === "up") {
        cursor = (cursor - 1 + options.length) % options.length;
        render();
      } else if (key.name === "down") {
        cursor = (cursor + 1) % options.length;
        render();
      } else if (key.name === "space") {
        const opt = options[cursor];
        if (opt !== "Done") {
          if (localSelected.has(opt)) localSelected.delete(opt);
          else localSelected.add(opt);
          render();
        }
      } else if (key.name === "return") {
        const opt = options[cursor];
        if (opt === "Done") {
          cleanup();
          resolve(localSelected);
        } else {
           // Toggle on enter too for convenience
           if (localSelected.has(opt)) localSelected.delete(opt);
           else localSelected.add(opt);
           render();
        }
      }
    };

    const cleanup = setupRawInput(onKey);
    render();
  });
}

export async function selectModelsHierarchically(
  rl: Interface,
  label: string,
  current: string[],
): Promise<string[]> {
  const groups = groupedModels();
  const selectedModels = new Set(current);
  let providerCursor = 0;

  if (!input.isTTY || !output.isTTY) {
     // Non-TTY fallback remains simple
     console.log(`\n◇  ${label}`);
     SUPPORTED_MODELS.forEach((m, i) => console.log(`  ${i+1}. ${m.id}`));
     const ans = await rl.question("Select model numbers (comma separated): ");
     const indices = ans.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
     return indices.map(i => SUPPORTED_MODELS[i-1]?.id).filter(Boolean);
  }

  while (true) {
    const providerOptions = [...groups.map(g => g.provider), "Done"];
    
    const choiceIdx = await new Promise<number>((resolve) => {
      let cursor = providerCursor;
      const render = () => {
        clearScreen();
        console.log(`◇  ${label}`);
        console.log("   Select a provider to see versions, or 'Done' to finish.\n");
        providerOptions.forEach((opt, i) => {
          const marker = i === cursor ? "●" : "○";
          const count = opt === "Done" ? "" : ` (${groups[i].items.filter(m => selectedModels.has(m.id)).length} selected)`;
          console.log(`  ${marker} ${opt}${count}`);
        });
      };

      const onKey = (_str: string, key: { name?: string; ctrl?: boolean }) => {
        if (key.ctrl && key.name === "c") process.exit(0);
        if (key.name === "up") { cursor = (cursor - 1 + providerOptions.length) % providerOptions.length; render(); }
        else if (key.name === "down") { cursor = (cursor + 1) % providerOptions.length; render(); }
        else if (key.name === "return") { cleanup(); resolve(cursor); }
      };
      const cleanup = setupRawInput(onKey);
      render();
    });

    providerCursor = choiceIdx;
    const selectedProvider = providerOptions[choiceIdx];

    if (selectedProvider === "Done") {
      break;
    }

    const group = groups.find(g => g.provider === selectedProvider);
    if (group) {
      const newSelection = await waitForProviderModelsSelection(group.provider, group.items, selectedModels);
      // Update global selection for this provider's models
      group.items.forEach(m => selectedModels.delete(m.id));
      newSelection.forEach(id => selectedModels.add(id));
    }
  }

  return [...selectedModels];
}

export async function selectFromList(
  rl: Interface,
  label: string,
  options: string[],
  current?: string,
): Promise<string> {
  const currentIndex = current ? Math.max(0, options.findIndex((o) => o === current)) : 0;
  if (!input.isTTY || !output.isTTY) {
    console.log(`\n◇  ${label}`);
    options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
    const choice = (await rl.question(`  Select (1-${options.length}): `)).trim();
    const idx = Number.parseInt(choice, 10) - 1;
    return idx >= 0 && idx < options.length ? options[idx] : options[currentIndex] || options[0];
  }

  const idx = await waitForSingleChoice(label, options, currentIndex);
  return options[idx] || options[currentIndex] || options[0];
}

export const CHANNELS = [
  { id: "cli", label: "CLI (Local)" },
  { id: "slack", label: "Slack" },
  { id: "discord", label: "Discord" },
  { id: "telegram", label: "Telegram" },
  { id: "teams", label: "Microsoft Teams" },
  { id: "email", label: "Email" },
  { id: "matrix", label: "Matrix (Decentralized)" },
  { id: "irc", label: "IRC" },
  { id: "http", label: "HTTP API" },
  { id: "grpc", label: "gRPC" },
  { id: "webhook", label: "Webhook" },
  { id: "whatsapp", label: "WhatsApp" },
];

export async function selectChannel(rl: Interface, current = "cli"): Promise<string> {
  // We need the config to show status
  const { ensureConfig } = await import("../config/settings.js");
  const cfg = await ensureConfig();

  const labels = CHANNELS.map((c) => {
    const isDefault = c.id === current;
    const isConfigured = c.id === "cli" || (cfg.channelConfigs[c.id]?.enabled && (cfg.channelConfigs[c.id]?.token || cfg.channelConfigs[c.id]?.apiKey));
    
    let status = "";
    if (isDefault) status = " [Active]";
    else if (isConfigured) status = " [Configured]";
    
    return `${c.label}${status}`;
  });

  const currentIdx = Math.max(
    0,
    CHANNELS.findIndex((c) => c.id === current),
  );

  if (!input.isTTY || !output.isTTY) {
    console.log("\n◇  Select default channel");
    labels.forEach((label, i) => {
      const marker = i === currentIdx ? "●" : "○";
      console.log(`  ${marker} ${label}`);
    });
    const choice = (await rl.question(`  Select (1-${CHANNELS.length}): `)).trim();
    const idx = parseInt(choice, 10) - 1;
    return idx >= 0 && idx < CHANNELS.length ? CHANNELS[idx].id : CHANNELS[currentIdx].id;
  }

  const idx = await waitForSingleChoice("Select default channel", labels, currentIdx);
  return CHANNELS[idx]?.id || CHANNELS[currentIdx].id;
}
