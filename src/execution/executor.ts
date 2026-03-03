import type { ChairmanPlan, ExecutionReport } from "../types/contracts.js";

export async function executePlan(plan: ChairmanPlan): Promise<ExecutionReport[]> {
  return plan.finalChunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    status: "success",
    artifacts: [],
    tests: [],
    errors: [],
    durationMs: 0,
  }));
}
