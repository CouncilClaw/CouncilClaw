import type { ChairmanPlan, ExecutionReport } from "../types/contracts.js";
import { checkCommandPolicy } from "./guardrails.js";
import { runCommand } from "./tool-runner.js";
import { browseUrl } from "./browser.js";

function extractTool(goal: string): { type: "cmd" | "browse" | null; payload: string } {
  const trimmed = goal.trim();
  if (trimmed.toLowerCase().startsWith("cmd:")) {
    return { type: "cmd", payload: trimmed.slice(4).trim() };
  }
  if (trimmed.toLowerCase().startsWith("browse:")) {
    return { type: "browse", payload: trimmed.slice(7).trim() };
  }
  return { type: null, payload: "" };
}

export async function executePlan(plan: ChairmanPlan): Promise<ExecutionReport[]> {
  const reports: ExecutionReport[] = [];

  for (const chunk of plan.finalChunks) {
    const start = Date.now();
    const { type, payload } = extractTool(chunk.goal);

    if (!type) {
      reports.push({
        chunkId: chunk.chunkId,
        status: "success",
        artifacts: [`No executable tool in goal; treated as planning-only chunk: ${chunk.goal}`],
        tests: [],
        errors: [],
        durationMs: Date.now() - start,
      });
      continue;
    }

    if (type === "cmd") {
      const command = payload;
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
    } else if (type === "browse") {
      const url = payload.startsWith("http") ? payload : `https://${payload}`;
      const content = await browseUrl(url);
      const ok = !content.startsWith("Error:");
      reports.push({
        chunkId: chunk.chunkId,
        status: ok ? "success" : "failed",
        artifacts: [content],
        tests: [],
        errors: ok ? [] : [content],
        durationMs: Date.now() - start,
      });
    }
  }

  return reports;
}
