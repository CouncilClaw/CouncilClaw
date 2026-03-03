import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { runCouncil } from "../council/council-engine.js";
import type { TaskEnvelope } from "../types/contracts.js";
import { isAuthValid } from "./auth.js";
import { checkRateLimit } from "./rate-limit.js";

interface WebhookPayload {
  userId?: string;
  channel?: TaskEnvelope["channel"];
  text?: string;
  chairmanModel?: string;
}

function readJson(req: IncomingMessage): Promise<WebhookPayload> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks).toString("utf8").trim();
        resolve(body ? (JSON.parse(body) as WebhookPayload) : {});
      } catch (err) {
        reject(err);
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

export function startWebhookServer(port = Number(process.env.PORT || 8787)): void {
  const server = createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/health") {
        return send(res, 200, { ok: true, service: "councilclaw" });
      }

      if (req.method === "POST" && req.url === "/task") {
        if (!isAuthValid(req)) {
          return send(res, 401, { ok: false, error: "Unauthorized" });
        }

        const clientIp = getClientIp(req);
        const { limit, windowMs } = rateLimitConfig();
        const rl = checkRateLimit(clientIp, limit, windowMs);
        if (!rl.allowed) {
          return send(res, 429, {
            ok: false,
            error: "Rate limit exceeded",
            retryAfterMs: Math.max(0, rl.resetAt - Date.now()),
          });
        }

        const payload = await readJson(req);

        if (!payload.text?.trim()) {
          return send(res, 400, { ok: false, error: "Missing 'text'" });
        }

        const task: TaskEnvelope = {
          id: randomUUID(),
          userId: payload.userId || "external-user",
          channel: payload.channel || "unknown",
          text: payload.text,
          createdAt: new Date().toISOString(),
          options: payload.chairmanModel ? { chairmanModel: payload.chairmanModel } : undefined,
        };

        const result = await runCouncil(task);
        return send(res, 200, { ok: true, taskId: task.id, result });
      }

      return send(res, 404, { ok: false, error: "Not found" });
    } catch (err) {
      return send(res, 500, {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown server error",
      });
    }
  });

  server.listen(port, () => {
    console.log(`CouncilClaw webhook listening on http://localhost:${port}`);
  });
}
