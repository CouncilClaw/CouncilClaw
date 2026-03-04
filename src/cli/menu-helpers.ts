import readline from "node:readline/promises";
import { SUPPORTED_MODELS, type SupportedModel } from "../llm/model-catalog.js";

export async function selectFromList(rl: readline.Interface, label: string, options: string[]): Promise<string> {
  console.log(`\n◇  ${label}`);
  options.forEach((opt, i) => {
    const marker = i === 0 ? "●" : "○";
    console.log(`  ${marker} ${opt}`);
  });
  const choice = (await rl.question("  Select (1-" + options.length + "): ")).trim();
  const idx = parseInt(choice, 10) - 1;
  return (idx >= 0 && idx < options.length) ? options[idx] : options[0];
}

export async function selectMultipleModels(
  rl: readline.Interface,
  label: string,
  min: number,
  max: number,
  current: string[]
): Promise<string[]> {
  console.log(`\n◇  ${label} [${min}-${max} models]`);
  console.log("  Enter model numbers separated by commas (or empty to keep current)");
  console.log("  Examples: 1,3,5 or 1-3,7\n");

  const modelsByProvider = new Map<string, SupportedModel[]>();
  SUPPORTED_MODELS.forEach((m) => {
    if (!modelsByProvider.has(m.provider)) {
      modelsByProvider.set(m.provider, []);
    }
    modelsByProvider.get(m.provider)!.push(m);
  });

  let idx = 1;
  const modelList: SupportedModel[] = [];
  for (const [provider, models] of modelsByProvider) {
    console.log(`\n  ${provider}:`);
    for (const m of models) {
      console.log(`    ${String(idx).padStart(2, " ")}. ${m.id.padEnd(40)} | ${m.label} [${m.tier}]`);
      modelList.push(m);
      idx++;
    }
  }

  const input = (await rl.question("\n  Selection: ")).trim();
  if (!input) return current;

  const selected = input.split(",").flatMap((part) => {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [from, to] = trimmed.split("-").map((x) => parseInt(x, 10));
      const range = [];
      for (let i = from; i <= to && i <= modelList.length; i++) range.push(i);
      return range;
    }
    return parseInt(trimmed, 10);
  });

  const unique = [...new Set(selected)].filter((n) => n > 0 && n <= modelList.length);

  if (unique.length < min) {
    console.log(`⚠️  Need at least ${min} model(s). Using current selection.`);
    return current;
  }
  if (unique.length > max) {
    console.log(`⚠️  Maximum ${max} models allowed. Using first ${max}.`);
    return unique.slice(0, max).map((i) => modelList[i - 1].id);
  }

  return unique.map((i) => modelList[i - 1].id);
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

export async function selectChannel(rl: readline.Interface): Promise<string> {
  console.log("\n◇  Select default channel");
  CHANNELS.forEach((ch, i) => {
    const marker = i === 0 ? "●" : "○";
    console.log(`  ${marker} ${ch.label}`);
  });
  const choice = (await rl.question("  Select (1-" + CHANNELS.length + "): ")).trim();
  const idx = parseInt(choice, 10) - 1;
  return (idx >= 0 && idx < CHANNELS.length) ? CHANNELS[idx].id : CHANNELS[0].id;
}
