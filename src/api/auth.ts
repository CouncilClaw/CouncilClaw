import type { IncomingMessage } from "node:http";

export function getBearerToken(req: IncomingMessage): string | null {
  const value = req.headers.authorization;
  if (!value) return null;
  const m = value.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

export function isAuthValid(req: IncomingMessage): boolean {
  const required = process.env.COUNCILCLAW_WEBHOOK_TOKEN?.trim();
  if (!required) return true;
  const token = getBearerToken(req);
  return !!token && token === required;
}
