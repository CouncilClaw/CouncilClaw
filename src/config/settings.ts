import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { SUPPORTED_MODELS } from "../llm/model-catalog.js";

export interface CouncilClawSettings {
  openRouterApiKey: string;
  openRouterBaseUrl: string;
  councilModels: string[];
  chairmanModel: string;
  allowedChairmanModels: string[];
  port: number;
  tracePath: string;
  allowedShellCommands: string[];
  execTimeoutMs: number;
}

export const CONFIG_PATH = process.env.COUNCILCLAW_CONFIG_PATH || join(homedir(), ".config", "councilclaw", "config.json");

export const DEFAULT_SETTINGS: CouncilClawSettings = {
  openRouterApiKey: "",
  openRouterBaseUrl: "https://openrouter.ai/api/v1",
  councilModels: [
    "openai/gpt-4.1-mini",
    "google/gemini-2.5-flash",
    "anthropic/claude-3.5-sonnet",
  ],
  chairmanModel: "openai/gpt-4.1",
  allowedChairmanModels: ["openai/gpt-4.1", "google/gemini-2.5-pro"],
  port: 8787,
  tracePath: "data/council-traces.jsonl",
  allowedShellCommands: ["echo", "ls", "pwd", "cat"],
  execTimeoutMs: 12000,
};

export async function ensureConfig(): Promise<CouncilClawSettings> {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  try {
    return await loadConfig();
  } catch {
    await saveConfig(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}

export async function loadConfig(): Promise<CouncilClawSettings> {
  const raw = await readFile(CONFIG_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<CouncilClawSettings>;
  return { ...DEFAULT_SETTINGS, ...parsed };
}

export async function saveConfig(cfg: CouncilClawSettings): Promise<void> {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

export function applyConfigToEnv(cfg: CouncilClawSettings): void {
  process.env.OPENROUTER_API_KEY = cfg.openRouterApiKey;
  process.env.OPENROUTER_BASE_URL = cfg.openRouterBaseUrl;
  process.env.COUNCIL_MODELS = cfg.councilModels.join(",");
  process.env.CHAIRMAN_MODEL = cfg.chairmanModel;
  process.env.ALLOWED_CHAIRMAN_MODELS = cfg.allowedChairmanModels.join(",");
  process.env.PORT = String(cfg.port);
  process.env.COUNCIL_TRACE_PATH = cfg.tracePath;
  process.env.ALLOWED_SHELL_COMMANDS = cfg.allowedShellCommands.join(",");
  process.env.EXEC_TIMEOUT_MS = String(cfg.execTimeoutMs);
}

export function validateModels(models: string[]): string[] {
  const set = new Set(SUPPORTED_MODELS.map((m) => m.id));
  return models.filter((m) => set.has(m));
}
