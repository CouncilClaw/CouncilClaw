import { describe, expect, it } from "vitest";
import { RuntimeEnvSchema, TaskEnvelopeSchema, WebhookPayloadSchema } from "../validation/schemas.js";

describe("validation schemas", () => {
  it("accepts a valid task envelope", () => {
    const result = TaskEnvelopeSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      userId: "u-1",
      channel: "discord",
      text: "build a worker",
      createdAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid webhook payload", () => {
    const result = WebhookPayloadSchema.safeParse({
      userId: "x",
      channel: "slack",
      text: "",
    });
    expect(result.success).toBe(false);
  });

  it("applies runtime env defaults", () => {
    const result = RuntimeEnvSchema.parse({});
    expect(result.openRouterBaseUrl).toBe("https://openrouter.ai/api/v1");
    expect(result.openRouterMaxRetries).toBe(2);
    expect(result.councilClawMode).toBe("library");
  });
});
