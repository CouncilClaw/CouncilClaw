import { synthesizePlan } from "./chairman.js";
import { anonymizeOpinions } from "./anonymizer.js";
import { detectDissent, runBlindReview } from "./reviewer.js";
import { executePlan } from "../execution/executor.js";
import { createLlmProvider } from "../llm/provider.js";
import { loadModelRegistry } from "../llm/model-registry.js";
import { resolveChairmanModel } from "../llm/model-selection.js";
import { decomposeTask } from "../planning/decomposer.js";
import { classifyTask } from "../router/complexity-router.js";
import { classifyTaskType } from "../router/task-type-router.js";
import { buildCouncilTrace } from "../telemetry/trace.js";
import { persistTrace } from "../telemetry/store.js";
import { logger } from "../telemetry/logger.js";
import { TaskEnvelopeSchema, type ValidatedTaskEnvelope } from "../validation/schemas.js";
import { ValidationError } from "../errors/index.js";
import { getMemoryOrchestrator } from "../memory/index.js";
import type { CouncilRunResult, TaskEnvelope, ModelOpinion, PeerReview } from "../types/contracts.js";

function withChairmanOverrideFromText(task: TaskEnvelope): TaskEnvelope {
  const match = task.text.match(/(?:^|\s)(?:\/chairman|chairman:)\s*([\w./:-]+)/i);
  if (!match) return task;

  return {
    ...task,
    text: task.text.replace(match[0], "").trim(),
    options: {
      ...task.options,
      chairmanModel: task.options?.chairmanModel || match[1],
    },
  };
}

function validateTaskEnvelope(taskInput: TaskEnvelope): ValidatedTaskEnvelope {
  try {
    return TaskEnvelopeSchema.parse(taskInput);
  } catch (error) {
    throw new ValidationError(
      `Task envelope validation failed: ${error instanceof Error ? error.message : String(error)}`,
      "taskInput",
      taskInput,
    );
  }
}

export async function runCouncil(taskInput: TaskEnvelope): Promise<CouncilRunResult> {
  const startTime = Date.now();

  try {
    // Validate input
    const validatedTask = validateTaskEnvelope(taskInput);
    const task = withChairmanOverrideFromText(validatedTask);
    logger.info("council-engine", "Council run initiated", { taskId: task.id, userId: task.userId });

    // Decomposition phase
    const decompositionStart = Date.now();
    const decision = classifyTask(task);
    const taskType = classifyTaskType(task.text);
    const chunks = decomposeTask(task);
    const decompositionMs = Date.now() - decompositionStart;
    logger.debug("council-engine", "Task decomposed", {
      taskId: task.id,
      complexity: decision.label,
      chunks: chunks.length,
      durationMs: decompositionMs,
    });

    // Model initialization
    const llm = createLlmProvider();
    const registry = loadModelRegistry();
    const chairman = resolveChairmanModel(task, registry);

    let firstPass: ModelOpinion[] = [];
    let firstPassMs = 0;
    let reviews: PeerReview[] = [];
    let reviewMs = 0;

    if (decision.label === "complex") {
      // First Pass phase
      const firstPassStart = Date.now();
      firstPass = await llm.firstOpinions(task, chunks);
      firstPassMs = Date.now() - firstPassStart;
      logger.debug("council-engine", "First opinions gathered", {
        taskId: task.id,
        opinions: firstPass.length,
        durationMs: firstPassMs,
      });

      // Review phase
      const reviewStart = Date.now();
      const anonymous = anonymizeOpinions(firstPass);
      reviews = runBlindReview(anonymous);
      reviewMs = Date.now() - reviewStart;
      logger.debug("council-engine", "Review phase completed", {
        taskId: task.id,
        reviews: reviews.length,
        durationMs: reviewMs,
      });
    } else {
      logger.info("council-engine", "Simple task detected - skipping council opinions", { taskId: task.id });
    }

    const anonymous = anonymizeOpinions(firstPass);
    const dissent = detectDissent(reviews) || chairman.note;

    // Synthesis phase
    const synthesisStart = Date.now();
    const draftedPlan = synthesizePlan(chunks, anonymous, reviews, chairman.model);
    const chairmanPlan = await llm.chairmanRefine(chairman.model, draftedPlan, anonymous, reviews, task.userId);
    const synthesisMs = Date.now() - synthesisStart;
    logger.debug("council-engine", "Synthesis phase completed", {
      taskId: task.id,
      chairmanModel: chairman.model,
      durationMs: synthesisMs,
    });

    // Execution phase
    const executionStart = Date.now();
    const reports = await executePlan(chairmanPlan);
    const executionMs = Date.now() - executionStart;
    logger.debug("council-engine", "Execution phase completed", {
      taskId: task.id,
      successCount: reports.filter((r) => r.status === "success").length,
      failCount: reports.filter((r) => r.status === "failed").length,
      durationMs: executionMs,
    });

    // Persistence
    const trace = buildCouncilTrace(anonymous, reviews, chairmanPlan.chairmanModel, dissent);
    trace.taskType = taskType;
    trace.timing = {
      decompositionMs,
      firstPassMs,
      reviewMs,
      synthesisMs,
      executionMs,
      totalMs: Date.now() - startTime,
    };

    const result = { decision, chairmanPlan, reports, trace };
    await persistTrace(task, result);

    // Record in memory system for future reference
    const orchestrator = getMemoryOrchestrator();
    await orchestrator.recordCouncilRun(task, result).catch((err) => {
      logger.warn("council-engine", "Failed to record council run in memory", {
        error: err instanceof Error ? err.message : String(err),
        taskId: task.id,
      });
    });

    logger.info("council-engine", "Council run completed", {
      taskId: task.id,
      totalDurationMs: trace.timing.totalMs,
      success: true,
    });

    return result;
  } catch (error) {
    const totalMs = Date.now() - startTime;
    logger.error(
      "council-engine",
      "Council run failed",
      error instanceof Error ? error : new Error(String(error)),
      {
        taskId: taskInput.id,
        totalDurationMs: totalMs,
      },
    );
    throw error;
  }
}
