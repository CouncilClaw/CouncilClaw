import { describe, expect, it } from "vitest";
import { checkCommandPolicy } from "../execution/guardrails.js";

describe("guardrails", () => {
  it("allows safe command", () => {
    const out = checkCommandPolicy("echo hi");
    expect(out.allowed).toBe(true);
  });

  it("blocks chained command", () => {
    const out = checkCommandPolicy("echo hi && ls");
    expect(out.allowed).toBe(false);
  });
});
