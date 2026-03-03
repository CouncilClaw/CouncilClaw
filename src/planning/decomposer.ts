import type { ChunkPlan, TaskEnvelope } from "../types/contracts.js";

function splitGoals(text: string): string[] {
  return text
    .split(/\n|\.|;|\band\b/gi)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function decomposeTask(task: TaskEnvelope): ChunkPlan[] {
  const goals = splitGoals(task.text);

  if (goals.length <= 1) {
    return [
      {
        chunkId: "chunk-1",
        goal: `Analyze and execute request: ${task.text}`,
        inputs: [task.text],
        expectedOutput: "Completed task output",
        riskLevel: "low",
      },
    ];
  }

  return goals.map((goal, i) => ({
    chunkId: `chunk-${i + 1}`,
    goal,
    inputs: [task.text],
    expectedOutput: `Deliverable for: ${goal}`,
    riskLevel: i === goals.length - 1 ? "medium" : "low",
    dependsOn: i === 0 ? [] : [`chunk-${i}`],
  }));
}
