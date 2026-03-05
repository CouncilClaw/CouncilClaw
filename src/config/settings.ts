import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { z } from "zod";
import { SUPPORTED_MODELS, MAX_COUNCIL_MODELS } from "../llm/model-catalog.js";

export interface ChannelConfig {
  enabled: boolean;
  apiKey?: string;
  webhookUrl?: string;
  appId?: string;
  appSecret?: string;
  region?: string;
  token?: string;
}

export interface CouncilClawSettings {
  openRouterApiKey: string;
  openRouterBaseUrl: string;
  councilModels: string[];
  chairmanModel: string;
  allowedChairmanModels: string[];
  defaultChannel: string;
  channelConfigs: Record<string, ChannelConfig>;
  port: number;
  tracePath: string;
  blockedShellCommands: string[];
  telegramCommands: string[];
  execTimeoutMs: number;
  webhookToken: string;
  rateLimitPerMinute: number;
  termsAccepted: boolean;
  termsAcceptedAt?: string;
}

export interface EnsureConfigResult {
  config: CouncilClawSettings;
  created: boolean;
}

export const CONFIG_PATH = process.env.COUNCILCLAW_CONFIG_PATH || join(homedir(), ".config", "councilclaw", "config.json");

export const DEFAULT_SETTINGS: CouncilClawSettings = {
  openRouterApiKey: "",
  openRouterBaseUrl: "https://openrouter.ai/api/v1",
  councilModels: [],
  chairmanModel: "",
  allowedChairmanModels: [],
  defaultChannel: "cli",
  channelConfigs: {
    cli: { enabled: true },
    slack: { enabled: false },
    discord: { enabled: false },
    telegram: { enabled: false },
    whatsapp: { enabled: false },
  },
  port: 8787,
  tracePath: "data/council-traces.jsonl",
  blockedShellCommands: ["rm", "mv", "shutdown", "reboot", "format", "mkfs"],
  telegramCommands: [
    "/start",
    "/council",
    "/help",
    "/commands",
    "/status",
    "/new",
    "/session",
    "/reset",
    "/stop",
    "/chairman",
    "/model",
    "/models",
    "/thinking",
    "/t",
    "/verbose",
    "/v",
    "/context",
    "/whoami",
    "/usage",
    "/compact",
  ],
  execTimeoutMs: 12000,
  webhookToken: "",
  rateLimitPerMinute: 30,
  termsAccepted: false,
  termsAcceptedAt: undefined,
};

const SUPPORTED_MODEL_IDS = new Set(SUPPORTED_MODELS.map((m) => m.id));
const modelIdSchema = z.string().trim().min(1).refine((m) => SUPPORTED_MODEL_IDS.has(m) || m === "", {
  message: "Unsupported model id",
});

const channelConfigSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  appId: z.string().optional(),
  appSecret: z.string().optional(),
  region: z.string().optional(),
  token: z.string().optional(),
});

const settingsSchema = z.object({
  openRouterApiKey: z.string(),
  openRouterBaseUrl: z.string().trim().url(),
  councilModels: z.array(modelIdSchema).max(MAX_COUNCIL_MODELS, `Maximum ${MAX_COUNCIL_MODELS} council models allowed`),
  chairmanModel: modelIdSchema,
  allowedChairmanModels: z.array(modelIdSchema).max(MAX_COUNCIL_MODELS, `Maximum ${MAX_COUNCIL_MODELS} allowed chairman models`),
  defaultChannel: z.string().trim().min(1).default("cli"),
  channelConfigs: z.record(channelConfigSchema).default({}),
  port: z.coerce.number().int().min(1).max(65535),
  tracePath: z.string().trim().min(1),
  blockedShellCommands: z.array(z.string().trim().min(1)).default([]),
  telegramCommands: z.array(z.string().trim().min(1)).default([]),
  execTimeoutMs: z.coerce.number().int().min(100).max(600_000),
  webhookToken: z.string(),
  rateLimitPerMinute: z.coerce.number().int().min(1).max(100_000),
  termsAccepted: z.boolean().default(false),
  termsAcceptedAt: z.string().datetime().optional(),
}).transform((data) => ({
  ...data,
  termsAccepted: data.termsAccepted !== undefined ? data.termsAccepted : false,
})) as z.ZodType<CouncilClawSettings>;

export async function configExists(): Promise<boolean> {
  try {
    await access(CONFIG_PATH, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureConfigDetailed(): Promise<EnsureConfigResult> {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  try {
    const config = await loadConfig();
    return { config, created: false };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
    await saveConfig(DEFAULT_SETTINGS);
    return { config: DEFAULT_SETTINGS, created: true };
  }
}

export async function ensureConfig(): Promise<CouncilClawSettings> {
  const { config } = await ensureConfigDetailed();
  return config;
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
  const validated = settingsSchema.safeParse(cfg);
  if (!validated.success) {
    const issues = validated.error.issues.map(i => `[${i.path.join(".")}] ${i.message}`).join("\n");
    throw new Error(`Configuration validation failed:\n${issues}`);
  }
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(validated.data, null, 2) + "\n", "utf8");
}

export function applyConfigToEnv(cfg: CouncilClawSettings): void {
  process.env.OPENROUTER_API_KEY = cfg.openRouterApiKey;
  process.env.OPENROUTER_BASE_URL = cfg.openRouterBaseUrl;
  process.env.COUNCIL_MODELS = cfg.councilModels.join(",");
  process.env.CHAIRMAN_MODEL = cfg.chairmanModel;
  process.env.ALLOWED_CHAIRMAN_MODELS = cfg.allowedChairmanModels.join(",");
  process.env.PORT = String(cfg.port);
  process.env.COUNCIL_TRACE_PATH = cfg.tracePath;
  process.env.BLOCKED_SHELL_COMMANDS = cfg.blockedShellCommands.join(",");
  process.env.TELEGRAM_COMMANDS = cfg.telegramCommands.join(",");
  process.env.EXEC_TIMEOUT_MS = String(cfg.execTimeoutMs);
  process.env.COUNCILCLAW_WEBHOOK_TOKEN = cfg.webhookToken;
  process.env.COUNCILCLAW_RATE_LIMIT = String(cfg.rateLimitPerMinute);
}

export function validateModels(models: string[]): string[] {
  const set = new Set(SUPPORTED_MODELS.map((m) => m.id));
  return models.filter((m) => set.has(m));
}
