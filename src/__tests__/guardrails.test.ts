import { describe, expect, it } from "vitest";
import { checkCommandPolicy } from "../execution/guardrails.js";

describe("guardrails", () => {
  it("allows safe command", () => {
    const out = checkCommandPolicy("echo hi");
    expect(out.allowed).toBe(true);
  });

  it("allows chained safe commands", () => {
    const out = checkCommandPolicy("echo hi && ls");
    expect(out.allowed).toBe(true);
  });

  it("blocks dangerous recursive rm", () => {
    const out = checkCommandPolicy("rm -rf /");
    expect(out.allowed).toBe(false);
    expect(out.reason).toContain("blocked for safety");
  });

  it("blocks dangerous pattern in chain", () => {
    const out = checkCommandPolicy("ls && rm -rf *");
    expect(out.allowed).toBe(false);
    expect(out.reason).toContain("dangerous pattern");
  });
  
  it("allows simple rm", () => {
    const out = checkCommandPolicy("rm temp.txt");
    expect(out.allowed).toBe(true);
  });
});
