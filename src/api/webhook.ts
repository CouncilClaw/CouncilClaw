import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { runCouncil } from "../council/council-engine.js";
import { WebhookPayloadSchema } from "../validation/schemas.js";
import { logger } from "../telemetry/logger.js";
import { ValidationError } from "../errors/index.js";
import type { TaskEnvelope } from "../types/contracts.js";
import { isAuthValid } from "./auth.js";
import { checkRateLimit } from "./rate-limit.js";

interface WebhookPayload {
  userId?: string;
  channel?: TaskEnvelope["channel"];
  text?: string;
  chairmanModel?: string;
}

const MAX_BODY_BYTES = 1024 * 1024;

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function readJson(req: IncomingMessage): Promise<WebhookPayload> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, "Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(Buffer.from(c));
    });
    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks).toString("utf8").trim();
        resolve(body ? (JSON.parse(body) as WebhookPayload) : {});
      } catch {
        reject(new HttpError(400, "Invalid JSON payload"));
      }
    });
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function getClientIp(req: IncomingMessage): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) return xff.split(",")[0]?.trim() || "unknown";
  return req.socket.remoteAddress || "unknown";
}

function rateLimitConfig(): { limit: number; windowMs: number } {
  return {
    limit: Number(process.env.COUNCILCLAW_RATE_LIMIT || 30),
    windowMs: Number(process.env.COUNCILCLAW_RATE_WINDOW_MS || 60_000),
  };
}

function validateWebhookPayload(payload: WebhookPayload): { userId: string; channel: TaskEnvelope["channel"]; text: string; chairmanModel?: string } {
  try {
    const validated = WebhookPayloadSchema.parse(payload);
    return {
      userId: validated.userId || "external-user",
      channel: validated.channel || "unknown",
      text: validated.text,
      chairmanModel: validated.chairmanModel,
    };
  } catch (error) {
    throw new ValidationError(
      `Webhook payload validation failed: ${error instanceof Error ? error.message : String(error)}`,
      "webhookPayload",
      payload,
    );
  }
}

export function startWebhookServer(port = Number(process.env.PORT || 8787)): void {
  const server = createServer(async (req, res) => {
    const requestId = randomUUID();
    try {
      if (req.method === "GET" && req.url === "/health") {
        logger.debug("webhook", "Health check", { requestId });
        return send(res, 200, { ok: true, service: "councilclaw" });
      }

      if (req.method === "POST" && req.url === "/task") {
        if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
          logger.warn("webhook", "Invalid content type", { requestId });
          return send(res, 415, { ok: false, error: "Content-Type must be application/json" });
        }

        if (!isAuthValid(req)) {
          logger.warn("webhook", "Authentication failed", { requestId });
          return send(res, 401, { ok: false, error: "Unauthorized" });
        }

        const clientIp = getClientIp(req);
        const { limit, windowMs } = rateLimitConfig();
        const rl = checkRateLimit(clientIp, limit, windowMs);
        if (!rl.allowed) {
          logger.warn("webhook", "Rate limit exceeded", { requestId, clientIp });
          return send(res, 429, {
            ok: false,
            error: "Rate limit exceeded",
            retryAfterMs: Math.max(0, rl.resetAt - Date.now()),
          });
        }

        const payload = await readJson(req);

        // Validate payload
        let validatedPayload: { userId: string; channel: TaskEnvelope["channel"]; text: string; chairmanModel?: string };
        try {
          validatedPayload = validateWebhookPayload(payload);
        } catch (error) {
          logger.warn("webhook", "Payload validation failed", { requestId, error: error instanceof Error ? error.message : String(error) });
          return send(res, 400, { ok: false, error: error instanceof Error ? error.message : "Invalid payload" });
        }

        const task: TaskEnvelope = {
          id: randomUUID(),
          userId: validatedPayload.userId,
          channel: validatedPayload.channel,
          text: validatedPayload.text,
          createdAt: new Date().toISOString(),
          options: validatedPayload.chairmanModel ? { chairmanModel: validatedPayload.chairmanModel } : undefined,
        };

        logger.info("webhook", "Task received and started", { requestId, taskId: task.id, userId: task.userId });

        const result = await runCouncil(task);
        logger.info("webhook", "Task completed successfully", { requestId, taskId: task.id });
        return send(res, 200, { ok: true, taskId: task.id, result });
      }

      logger.debug("webhook", "Not found", { requestId, method: req.method, url: req.url });
      return send(res, 404, { ok: false, error: "Not found" });
    } catch (err) {
      if (err instanceof HttpError) {
        logger.warn("webhook", `HTTP error: ${err.message}`, { requestId });
        return send(res, err.status, { ok: false, error: err.message });
      }
      logger.error("webhook", "Unexpected error", err instanceof Error ? err : new Error(String(err)), { requestId });
      return send(res, 500, {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown server error",
      });
    }
  });

  server.listen(port, () => {
    logger.info("webhook", `CouncilClaw webhook listening on http://localhost:${port}`);
  });
}
