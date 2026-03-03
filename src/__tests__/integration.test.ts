import { describe, it, expect } from "vitest";
import { runCouncil } from "../council/council-engine.js";
import { ValidationError } from "../errors/index.js";
import type { TaskEnvelope } from "../types/contracts.js";

function makeTask(overrides: Partial<TaskEnvelope> = {}): TaskEnvelope {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    userId: "test-user",
    channel: "slack",
    text: "Implement parser and tests",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("council engine integration", () => {
  describe("input validation", () => {
    it("rejects invalid uuid", async () => {
      await expect(runCouncil(makeTask({ id: "not-a-uuid" }))).rejects.toThrow(ValidationError);
    });

    it("rejects empty userId", async () => {
      await expect(runCouncil(makeTask({ userId: "" }))).rejects.toThrow(ValidationError);
    });

    it("rejects empty text", async () => {
      await expect(runCouncil(makeTask({ text: "" }))).rejects.toThrow(ValidationError);
    });

    it("rejects invalid createdAt", async () => {
      await expect(runCouncil(makeTask({ createdAt: "not-a-date" }))).rejects.toThrow(ValidationError);
    });
  });

  describe("successful run shape", () => {
    it("returns chairman plan, reports, and timing", async () => {
      const result = await runCouncil(makeTask());

      expect(result.chairmanPlan.chairmanModel).toBeTruthy();
      expect(result.chairmanPlan.finalChunks.length).toBeGreaterThan(0);
      expect(Array.isArray(result.reports)).toBe(true);
      expect(result.trace.timing?.totalMs).toBeGreaterThanOrEqual(0);
      expect(result.trace.timing?.executionMs).toBeGreaterThanOrEqual(0);
    });

    it("accepts chairman model override from inline text", async () => {
      const result = await runCouncil(makeTask({ text: "/chairman openai/gpt-4.1 Build api tests" }));
      expect(result.trace.selectedChairmanModel).toBe("openai/gpt-4.1");
    });
  });
});
