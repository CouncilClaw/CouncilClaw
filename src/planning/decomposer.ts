import type { ChunkPlan, TaskEnvelope } from "../types/contracts.js";

export function decomposeTask(task: TaskEnvelope): ChunkPlan[] {
  return [
    {
      chunkId: "chunk-1",
      goal: `Analyze request: ${task.text}`,
      inputs: [task.text],
      expectedOutput: "Structured execution approach",
      riskLevel: "low",
    },
  ];
}
