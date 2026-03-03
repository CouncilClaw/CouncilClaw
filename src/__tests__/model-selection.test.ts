import { describe, expect, it } from "vitest";
import { resolveChairmanModel } from "../llm/model-selection.js";

const registry = {
  councilModels: ["openai/gpt-4.1-mini", "google/gemini-2.5-flash"],
  chairmanModel: "openai/gpt-4.1",
};

describe("resolveChairmanModel", () => {
  it("uses allowlisted requested model", () => {
    const out = resolveChairmanModel(
      { id: "1", userId: "u", channel: "unknown", text: "x", createdAt: "now", options: { chairmanModel: "openai/gpt-4.1" } },
      registry,
    );
    expect(out.model).toBe("openai/gpt-4.1");
    expect(out.source).toBe("user");
  });

  it("falls back for unallowlisted model", () => {
    const out = resolveChairmanModel(
      { id: "2", userId: "u", channel: "unknown", text: "x", createdAt: "now", options: { chairmanModel: "not/a-model" } },
      registry,
    );
    expect(out.model).toBe("openai/gpt-4.1");
    expect(out.source).toBe("default");
    expect(out.note).toBeTruthy();
  });
});
