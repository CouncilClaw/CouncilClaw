import type { ComplexityDecision, TaskEnvelope } from "../types/contracts.js";

const COMPLEX_KEYWORDS = [
  "build",
  "implement",
  "refactor",
  "debug",
  "architecture",
  "pipeline",
  "integrate",
  "multi-step",
  "automation",
  "deploy",
  "test",
  "code",
];

export function classifyTask(task: TaskEnvelope): ComplexityDecision {
  const text = task.text.toLowerCase();
  const hits = COMPLEX_KEYWORDS.filter((k) => text.includes(k)).length;
  const score = Math.min(1, hits / 4);

  if (score >= 0.5 || text.length > 240) {
    return {
      label: "complex",
      score,
      reason: "Keyword+length heuristic indicates multi-step execution.",
    };
  }

  return {
    label: "simple",
    score,
    reason: "Task appears short and single-step.",
  };
}
