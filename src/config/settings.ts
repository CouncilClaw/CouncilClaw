import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { z } from "zod";
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
  webhookToken: string;
  rateLimitPerMinute: number;
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
  webhookToken: "",
  rateLimitPerMinute: 30,
};

const SUPPORTED_MODEL_IDS = new Set(SUPPORTED_MODELS.map((m) => m.id));
const modelIdSchema = z.string().trim().min(1).refine((m) => SUPPORTED_MODEL_IDS.has(m), {
  message: "Unsupported model id",
});

const settingsSchema: z.ZodType<CouncilClawSettings> = z.object({
  openRouterApiKey: z.string(),
  openRouterBaseUrl: z.string().trim().url(),
  councilModels: z.array(modelIdSchema).min(1),
  chairmanModel: modelIdSchema,
  allowedChairmanModels: z.array(modelIdSchema).min(1),
  port: z.coerce.number().int().min(1).max(65535),
  tracePath: z.string().trim().min(1),
  allowedShellCommands: z.array(z.string().trim().min(1)).min(1),
  execTimeoutMs: z.coerce.number().int().min(100).max(600_000),
  webhookToken: z.string(),
  rateLimitPerMinute: z.coerce.number().int().min(1).max(100_000),
});

export async function ensureConfig(): Promise<CouncilClawSettings> {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  try {
    return await loadConfig();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
    await saveConfig(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}

export async function loadConfig(): Promise<CouncilClawSettings> {
  const raw = await readFile(CONFIG_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<CouncilClawSettings>;
  const combined = { ...DEFAULT_SETTINGS, ...parsed };
  const validated = settingsSchema.safeParse(combined);
  if (!validated.success) {
    const details = validated.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
    throw new Error(`Invalid config file at ${CONFIG_PATH}. ${details}`);
  }
  return validated.data;
}

export async function saveConfig(cfg: CouncilClawSettings): Promise<void> {
  const validated = settingsSchema.parse(cfg);
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(validated, null, 2) + "\n", "utf8");
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
  process.env.COUNCILCLAW_WEBHOOK_TOKEN = cfg.webhookToken;
  process.env.COUNCILCLAW_RATE_LIMIT = String(cfg.rateLimitPerMinute);
}


export function validateModels(models: string[]): string[] {
  const set = new Set(SUPPORTED_MODELS.map((m) => m.id));
  return models.filter((m) => set.has(m));
}
