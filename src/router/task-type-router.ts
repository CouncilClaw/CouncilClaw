export type TaskType = "coding" | "research" | "planning" | "ops" | "general";

export function classifyTaskType(text: string): TaskType {
  const t = text.toLowerCase();
  if (/(code|refactor|bug|test|typescript|python|api|compile)/.test(t)) return "coding";
  if (/(research|analyze|compare|find|summarize|investigate)/.test(t)) return "research";
  if (/(plan|roadmap|milestone|strategy|scope)/.test(t)) return "planning";
  if (/(deploy|infra|server|docker|kubernetes|pipeline|ci\/cd)/.test(t)) return "ops";
  return "general";
}
