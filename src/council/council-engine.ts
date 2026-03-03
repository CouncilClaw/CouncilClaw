import { synthesizePlan } from "./chairman.js";
import { anonymizeOpinions } from "./anonymizer.js";
import { detectDissent, runBlindReview } from "./reviewer.js";
import { executePlan } from "../execution/executor.js";
import { createLlmProvider } from "../llm/provider.js";
import { loadModelRegistry } from "../llm/model-registry.js";
import { resolveChairmanModel } from "../llm/model-selection.js";
import { decomposeTask } from "../planning/decomposer.js";
import { classifyTask } from "../router/complexity-router.js";
import { buildCouncilTrace } from "../telemetry/trace.js";
import type { CouncilRunResult, TaskEnvelope } from "../types/contracts.js";

function withChairmanOverrideFromText(task: TaskEnvelope): TaskEnvelope {
  const match = task.text.match(/(?:^|\s)(?:\/chairman|chairman:)\s*([\w./:-]+)/i);
  if (!match) return task;

  return {
    ...task,
    options: {
      ...task.options,
      chairmanModel: task.options?.chairmanModel || match[1],
    },
  };
}

export async function runCouncil(taskInput: TaskEnvelope): Promise<CouncilRunResult> {
  const task = withChairmanOverrideFromText(taskInput);
  const decision = classifyTask(task);
  const chunks = decomposeTask(task);
  const llm = createLlmProvider();
  const registry = loadModelRegistry();
  const chairman = resolveChairmanModel(task, registry);

  const firstPass = await llm.firstOpinions(task, chunks);
  const anonymous = anonymizeOpinions(firstPass);
  const reviews = decision.label === "complex" ? runBlindReview(anonymous) : [];
  const dissent = detectDissent(reviews) || chairman.note;

  const draftedPlan = synthesizePlan(chunks, anonymous, reviews, chairman.model);
  const chairmanPlan = await llm.chairmanRefine(chairman.model, draftedPlan, anonymous, reviews);

  const reports = await executePlan(chairmanPlan);
  const trace = buildCouncilTrace(anonymous, reviews, chairman.model, dissent);

  return { decision, chairmanPlan, reports, trace };
}
