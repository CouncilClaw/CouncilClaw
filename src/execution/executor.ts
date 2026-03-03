import type { ChairmanPlan, ExecutionReport } from "../types/contracts.js";
import { checkCommandPolicy } from "./guardrails.js";
import { runCommand } from "./tool-runner.js";

function extractCommand(goal: string): string | null {
  const trimmed = goal.trim();
  if (trimmed.toLowerCase().startsWith("cmd:")) {
    return trimmed.slice(4).trim();
  }
  return null;
}

export async function executePlan(plan: ChairmanPlan): Promise<ExecutionReport[]> {
  const reports: ExecutionReport[] = [];

  for (const chunk of plan.finalChunks) {
    const start = Date.now();
    const command = extractCommand(chunk.goal);

    if (!command) {
      reports.push({
        chunkId: chunk.chunkId,
        status: "success",
        artifacts: [`No executable command in goal; treated as planning-only chunk: ${chunk.goal}`],
        tests: [],
        errors: [],
        durationMs: Date.now() - start,
      });
      continue;
    }

    const policy = checkCommandPolicy(command);
    if (!policy.allowed) {
      reports.push({
        chunkId: chunk.chunkId,
        status: "skipped",
        artifacts: [],
        tests: [],
        errors: [policy.reason || "Blocked by policy"],
        durationMs: Date.now() - start,
      });
      continue;
    }

    const out = await runCommand(command);
    reports.push({
      chunkId: chunk.chunkId,
      status: out.ok ? "success" : "failed",
      artifacts: out.stdout ? [out.stdout.slice(0, 1000)] : [],
      tests: [],
      errors: [out.stderr, out.error].filter(Boolean) as string[],
      durationMs: Date.now() - start,
    });
  }

  return reports;
}
