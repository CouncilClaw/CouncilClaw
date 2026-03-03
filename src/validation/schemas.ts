/**
 * Zod schemas for input validation across CouncilClaw
 */

import { z } from "zod";
import { MAX_COUNCIL_MODELS, MIN_COUNCIL_MODELS } from "../llm/model-catalog.js";

// TaskEnvelope validation
export const ChannelSchema = z.enum([
  "telegram",
  "discord",
  "whatsapp",
  "slack",
  "email",
  "teams",
  "matrix",
  "irc",
  "http",
  "grpc",
  "cli",
  "webhook",
  "unknown",
]);

export const TaskEnvelopeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1, "userId is required"),
  channel: ChannelSchema,
  text: z.string().min(1, "task text is required"),
  attachments: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  options: z
    .object({
      chairmanModel: z.string().optional(),
    })
    .optional(),
});

export type ValidatedTaskEnvelope = z.infer<typeof TaskEnvelopeSchema>;

// Configuration validation
export const CouncilClawConfigSchema = z.object({
  openrouter_api_key: z.string().optional(),
  chairman_model: z.string().default("openai/gpt-4.1"),
  council_models: z
    .string()
    .default("openai/gpt-4.1-mini,google/gemini-2.5-flash")
    .transform((s) =>
      s
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
    )
    .refine(
      (models) => models.length >= MIN_COUNCIL_MODELS && models.length <= MAX_COUNCIL_MODELS,
      `Council must have between ${MIN_COUNCIL_MODELS} and ${MAX_COUNCIL_MODELS} models`,
    ),
  allowed_chairman_models: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",").map((m) => m.trim()).filter(Boolean) : []))
    .refine(
      (models) => models.length === 0 || models.length <= MAX_COUNCIL_MODELS,
      `Allowed chairman models cannot exceed ${MAX_COUNCIL_MODELS}`,
    ),
  allowed_shell_commands: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(",").map((m) => m.trim()).filter(Boolean) : [])),
});

export type ValidatedConfig = z.infer<typeof CouncilClawConfigSchema>;

// Webhook payload validation
export const WebhookPayloadSchema = z.object({
  userId: z.string().min(1).optional(),
  channel: ChannelSchema.optional(),
  text: z.string().min(1, "text is required"),
  chairmanModel: z.string().optional(),
});

export type ValidatedWebhookPayload = z.infer<typeof WebhookPayloadSchema>;

// Environment validation
export const RuntimeEnvSchema = z.object({
  openRouterApiKey: z.string().optional(),
  openRouterBaseUrl: z.string().url().default("https://openrouter.ai/api/v1"),
  openRouterMaxRetries: z.number().min(0).default(2),
  openRouterRetryBaseMs: z.number().min(0).default(500),
  traceStorePath: z.string().default("data/council-traces.jsonl"),
  councilClawMode: z.enum(["server", "cli", "library"]).default("library"),
  debugMode: z.boolean().default(false),
});

export type ValidatedRuntimeEnv = z.infer<typeof RuntimeEnvSchema>;
