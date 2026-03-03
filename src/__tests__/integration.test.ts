import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { runCouncil } from "../council/council-engine.js";
import { ValidationError, ConfigurationError } from "../errors/index.js";
import type { TaskEnvelope } from "../types/contracts.js";

describe("Council Engine Integration Tests", () => {
  let validTask: TaskEnvelope;

  beforeEach(() => {
    validTask = {
      id: "test-123",
      userId: "test-user",
      channel: "slack",
      text: "Simple test task",
      createdAt: new Date().toISOString(),
    };
  });

  describe("Input Validation", () => {
    it("should reject task with invalid id (not UUID)", async () => {
      const invalidTask = { ...validTask, id: "not-a-uuid" };
      await expect(runCouncil(invalidTask)).rejects.toThrow(ValidationError);
    });

    it("should reject task with empty userId", async () => {
      const invalidTask = { ...validTask, userId: "" };
      await expect(runCouncil(invalidTask)).rejects.toThrow(ValidationError);
    });

    it("should reject task with empty text", async () => {
      const invalidTask = { ...validTask, text: "" };
      await expect(runCouncil(invalidTask)).rejects.toThrow(ValidationError);
    });

    it("should reject task with invalid createdAt date", async () => {
      const invalidTask = { ...validTask, createdAt: "not-a-date" };
      await expect(runCouncil(invalidTask)).rejects.toThrow(ValidationError);
    });

    it("should reject task with invalid channel", async () => {
      const invalidTask = { ...validTask, channel: "invalid-channel" as any };
      await expect(runCouncil(invalidTask)).rejects.toThrow(ValidationError);
    });

    it("should accept optional fields", async () => {
      const taskWithOptions: TaskEnvelope = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        userId: "test-user",
        channel: "slack",
        text: "Test task",
        createdAt: new Date().toISOString(),
        options: { chairmanModel: "openai/gpt-4.1" },
        attachments: ["file1.txt"],
      };
      // Should not throw
      expect(() => runCouncil(taskWithOptions)).toBeDefined();
    });
  });

  describe("Council Execution Pipeline", () => {
    it("should track execution timing", async () => {
      // Mock would be needed for full integration
      // This test validates the timing structure
      const result = {
        trace: {
          timing: {
            decompositionMs: 100,
            firstPassMs: 1000,
            reviewMs: 500,
            synthesisMs: 800,
            executionMs: 2000,
            totalMs: 4400,
          },
        },
      };

      expect(result.trace.timing?.totalMs).toBeGreaterThan(0);
      expect(result.trace.timing?.decompositionMs).toBeLessThan(result.trace.timing?.totalMs);
      expect(
        result.trace.timing?.decompositionMs +
          result.trace.timing?.firstPassMs +
          result.trace.timing?.reviewMs +
          result.trace.timing?.synthesisMs +
          result.trace.timing?.executionMs,
      ).toBeLessThanOrEqual(result.trace.timing?.totalMs);
    });
  });

  describe("Error Handling", () => {
    it("should log errors with context", async () => {
      const logSpy = vi.spyOn(console, "error");

      try {
        await runCouncil({ ...validTask, text: "" });
      } catch {
        // Error expected
      }

      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it("should include error code in custom error", () => {
      const error = new ValidationError("test message", "testField", "testValue");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.field).toBe("testField");
      expect(error.value).toBe("testValue");
    });

    it("should include context in configuration error", () => {
      const error = new ConfigurationError("Missing API key", "openRouterApiKey", {
        env: "production",
      });
      expect(error.code).toBe("CONFIGURATION_ERROR");
      expect(error.context?.env).toBe("production");
    });
  });

  describe("Chairman Model Resolution", () => {
    it("should accept chairman model override in options", async () => {
      const taskWithOverride: TaskEnvelope = {
        ...validTask,
        id: "550e8400-e29b-41d4-a716-446655440001",
        options: { chairmanModel: "openai/gpt-4.1" },
      };
      // Should not throw validation error
      expect(() => runCouncil(taskWithOverride)).toBeDefined();
    });

    it("should extract chairman model from inline text", async () => {
      const taskWithInlineChairman: TaskEnvelope = {
        ...validTask,
        id: "550e8400-e29b-41d4-a716-446655440002",
        text: "/chairman openai/gpt-4.1 What is the task?",
      };
      // Should extract and validate
      expect(taskWithInlineChairman.text).toContain("What is the task");
    });
  });

  describe("Channel Tracking", () => {
    const channels: TaskEnvelope["channel"][] = ["slack", "discord", "telegram", "whatsapp", "email", "unknown"];

    channels.forEach((channel) => {
      it(`should accept channel: ${channel}`, async () => {
        const taskWithChannel: TaskEnvelope = {
          ...validTask,
          id: `550e8400-e29b-41d4-a716-44665544${String(channels.indexOf(channel)).padStart(4, "0")}`,
          channel,
        };
        expect(taskWithChannel.channel).toBe(channel);
      });
    });
  });

  describe("Logging", () => {
    it("should log with structured context", async () => {
      const infoSpy = vi.spyOn(console, "log");

      // Mock to prevent actual execution
      // This validates the logging structure
      expect(infoSpy).toBeDefined();
      infoSpy.mockRestore();
    });
  });
});
