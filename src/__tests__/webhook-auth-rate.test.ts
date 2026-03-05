import { describe, expect, it } from "vitest";
import { checkRateLimit } from "../api/rate-limit.js";
import { isAuthValid } from "../api/auth.js";

describe("rate-limit", () => {
  it("allows up to limit and blocks after", () => {
    const key = `test-${Date.now()}`;
    const a = checkRateLimit(key, 2, 10_000);
    const b = checkRateLimit(key, 2, 10_000);
    const c = checkRateLimit(key, 2, 10_000);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(c.allowed).toBe(false);
  });
});

describe("auth", () => {
  it("accepts when token not configured", () => {
    delete process.env.COUNCILCLAW_WEBHOOK_TOKEN;
    const req = { headers: {} } as import("node:http").IncomingMessage;
    expect(isAuthValid(req)).toBe(true);
  });

  it("validates bearer token when configured", () => {
    process.env.COUNCILCLAW_WEBHOOK_TOKEN = "secret";
    const ok = { headers: { authorization: "Bearer secret" } } as import("node:http").IncomingMessage;
    const bad = { headers: { authorization: "Bearer nope" } } as import("node:http").IncomingMessage;
    expect(isAuthValid(ok)).toBe(true);
    expect(isAuthValid(bad)).toBe(false);
    delete process.env.COUNCILCLAW_WEBHOOK_TOKEN;
  });
});
