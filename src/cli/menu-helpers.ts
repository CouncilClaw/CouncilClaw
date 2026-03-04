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

function parseSelectionInput(raw: string, max: number): number[] {
  const selected = raw
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      if (!trimmed) return [];
      if (trimmed.includes("-")) {
        const [from, to] = trimmed.split("-").map((x) => parseInt(x, 10));
        if (!Number.isFinite(from) || !Number.isFinite(to)) return [];
        const out: number[] = [];
        const start = Math.min(from, to);
        const end = Math.max(from, to);
        for (let i = start; i <= end; i += 1) out.push(i);
        return out;
      }
      const n = parseInt(trimmed, 10);
      return Number.isFinite(n) ? [n] : [];
    })
    .filter((n) => n > 0 && n <= max);

  return [...new Set(selected)];
}

function groupedModels(): Array<{ provider: string; items: SupportedModel[] }> {
  const map = new Map<string, SupportedModel[]>();
  for (const model of SUPPORTED_MODELS) {
    if (!map.has(model.provider)) map.set(model.provider, []);
    map.get(model.provider)?.push(model);
  }
  return [...map.entries()].map(([provider, items]) => ({ provider, items }));
}

function flattenModels(): Array<{ index: number; model: SupportedModel }> {
  return SUPPORTED_MODELS.map((model, i) => ({ index: i + 1, model }));
}

function waitForSingleChoice(
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

function waitForModelMultiChoice(
  label: string,
  min: number,
  max: number,
  current: string[],
): Promise<string[]> {
  return new Promise((resolve) => {
    const flat = flattenModels();
    const currentSet = new Set(current);
    const selected = new Set<number>(
      flat.filter((item) => currentSet.has(item.model.id)).map((item) => item.index),
    );
    let cursor = 0;

    if (!selected.size && flat.length) selected.add(1);

    const render = (): void => {
      clearScreen();
      console.log(`◇  ${label} [${min}-${max} models]`);
      console.log("   Use ↑/↓ to move, Space to toggle, Enter to confirm, q to keep current.\n");

      let idx = 1;
      for (const group of groupedModels()) {
        console.log(`  ${group.provider}:`);
        for (const model of group.items) {
          const lineIndex = idx - 1;
          const focused = lineIndex === cursor ? ">" : " ";
          const mark = selected.has(idx) ? "x" : " ";
          console.log(
            `   ${focused} [${mark}] ${String(idx).padStart(2, " ")}. ${model.id.padEnd(40)} | ${model.label} [${model.tier}]`,
          );
          idx += 1;
        }
        console.log("");
      }

      console.log(`   Selected: ${selected.size} model(s)`);
      if (selected.size < min) {
        console.log(`   Need at least ${min}.`);
      } else if (selected.size > max) {
        console.log(`   Maximum ${max}.`);
      }
    };

    const done = (keepCurrent = false): void => {
      cleanup();
      if (keepCurrent) {
        console.log("");
        resolve(current);
        return;
      }
      const picked = [...selected].sort((a, b) => a - b);
      if (picked.length < min || picked.length > max) {
        console.log(`\n⚠️  Selection must be between ${min} and ${max}. Keeping current values.\n`);
        resolve(current);
        return;
      }
      console.log("");
      resolve(picked.map((n) => flat[n - 1]?.model.id).filter(Boolean));
    };

    const onKey = (str: string, key: { name?: string; ctrl?: boolean }): void => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.stdout.write("\nGoodbye.\n");
        process.exit(0);
      }

      if (key.name === "up") {
        cursor = (cursor - 1 + flat.length) % flat.length;
        render();
        return;
      }

      if (key.name === "down") {
        cursor = (cursor + 1) % flat.length;
        render();
        return;
      }

      if (key.name === "space") {
        const idx = cursor + 1;
        if (selected.has(idx)) selected.delete(idx);
        else selected.add(idx);
        render();
        return;
      }

      if (key.name === "q") {
        done(true);
        return;
      }

      if (key.name === "return") {
        done(false);
        return;
      }

      // Allow quick toggle by number key presses.
      const n = parseInt(str, 10);
      if (Number.isFinite(n) && n >= 1 && n <= flat.length) {
        if (selected.has(n)) selected.delete(n);
        else selected.add(n);
        cursor = n - 1;
        render();
      }
    };

    const cleanup = setupRawInput(onKey);
    render();
  });
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

export async function selectMultipleModels(
  rl: Interface,
  label: string,
  min: number,
  max: number,
  current: string[],
): Promise<string[]> {
  if (!input.isTTY || !output.isTTY) {
    console.log(`\n◇  ${label} [${min}-${max} models]`);
    console.log("  Enter model numbers separated by commas (or empty to keep current)");
    console.log("  Examples: 1,3,5 or 1-3,7\n");

    const flat = flattenModels();
    for (const item of flat) {
      console.log(
        `    ${String(item.index).padStart(2, " ")}. ${item.model.id.padEnd(40)} | ${item.model.label} [${item.model.tier}]`,
      );
    }

    const raw = (await rl.question("\n  Selection: ")).trim();
    if (!raw) return current;
    const picked = parseSelectionInput(raw, flat.length);
    if (picked.length < min || picked.length > max) return current;
    return picked.map((n) => flat[n - 1]?.model.id).filter(Boolean);
  }

  return waitForModelMultiChoice(label, min, max, current);
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
  const labels = CHANNELS.map((c) => c.label);
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
