import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { runCouncil } from "../council/council-engine.js";
import type { TaskEnvelope } from "../types/contracts.js";

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

export function startWebhookServer(port = Number(process.env.PORT || 8787)): void {
  const server = createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/health") {
        return send(res, 200, { ok: true, service: "councilclaw" });
      }

      if (req.method === "POST" && req.url === "/task") {
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
    // eslint-disable-next-line no-console
    console.log(`CouncilClaw webhook listening on http://localhost:${port}`);
  });
}
