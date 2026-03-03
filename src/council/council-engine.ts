import { synthesizePlan } from "./chairman.js";
import { anonymizeOpinions } from "./anonymizer.js";
import { runBlindReview } from "./reviewer.js";
import { executePlan } from "../execution/executor.js";
import { StubLlmProvider } from "../llm/provider.js";
import { decomposeTask } from "../planning/decomposer.js";
import { classifyTask } from "../router/complexity-router.js";
import { buildCouncilTrace } from "../telemetry/trace.js";
import type { CouncilRunResult, TaskEnvelope } from "../types/contracts.js";

export async function runCouncil(task: TaskEnvelope): Promise<CouncilRunResult> {
  const decision = classifyTask(task);
  const chunks = decomposeTask(task);
  const llm = new StubLlmProvider();

  const firstPass = await llm.firstOpinions(task, chunks);
  const anonymous = anonymizeOpinions(firstPass);
  const reviews = decision.label === "complex" ? runBlindReview(anonymous) : [];
  const chairmanPlan = synthesizePlan(chunks, anonymous, reviews);
  const reports = await executePlan(chairmanPlan);
  const trace = buildCouncilTrace(anonymous, reviews);

  return { decision, chairmanPlan, reports, trace };
}
