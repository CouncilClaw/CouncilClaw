import { describe, expect, it } from "vitest";
import { classifyTask } from "../router/complexity-router.js";

describe("complexity-router", () => {
  it("classifies short simple task as simple", () => {
    const out = classifyTask({
      id: "1",
      userId: "u",
      channel: "unknown",
      text: "say hello",
      createdAt: new Date().toISOString(),
    });
    expect(out.label).toBe("simple");
  });

  it("classifies coding task as complex", () => {
    const out = classifyTask({
      id: "2",
      userId: "u",
      channel: "unknown",
      text: "build and refactor api then add tests",
      createdAt: new Date().toISOString(),
    });
    expect(out.label).toBe("complex");
  });
});
