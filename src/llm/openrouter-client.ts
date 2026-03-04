import type { ChairmanPlan, ChunkPlan, ModelOpinion, PeerReview, TaskEnvelope } from "../types/contracts.js";
import type { LlmProvider } from "./provider.js";
import { loadModelRegistry } from "./model-registry.js";
import { getEnv } from "../config/env.js";
import { getMemoryOrchestrator } from "../memory/index.js";

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OpenRouterLlmProvider implements LlmProvider {
  private readonly registry = loadModelRegistry();

  async firstOpinions(task: TaskEnvelope, chunks: ChunkPlan[]): Promise<ModelOpinion[]> {
    const { openRouterApiKey: apiKey } = getEnv();
    if (!apiKey) {
      return chunks.map((chunk, i) => ({
        proposalId: `proposal-stub-${i + 1}`,
        modelAlias: this.registry.councilModels[i % this.registry.councilModels.length] || `model-${i + 1}`,
        chunkId: chunk.chunkId,
        proposal: `Stub response (no OPENROUTER_API_KEY) for chunk: ${chunk.goal}`,
        confidence: 0.45,
      }));
    }

    const calls = chunks.map(async (chunk, i) => {
      const model = this.registry.councilModels[i % this.registry.councilModels.length];
      const content = await this.askModel(model, task, chunk);
      return {
        proposalId: `proposal-${i + 1}`,
        modelAlias: model,
        chunkId: chunk.chunkId,
        proposal: content,
        confidence: 0.7,
      } satisfies ModelOpinion;
    });

    return Promise.all(calls);
  }

  async chairmanRefine(
    chairmanModel: string,
    plan: ChairmanPlan,
    opinions: ModelOpinion[],
    reviews: PeerReview[],
    userId?: string,
  ): Promise<ChairmanPlan> {
    const { openRouterApiKey: apiKey } = getEnv();
    if (!apiKey) {
      return {
        ...plan,
        rationale: `${plan.rationale} (offline mode: OPENROUTER_API_KEY is missing, using draft synthesis)`,
      };
    }

    // Inject memory context for chairman
    let memoryContext = "";
    if (userId) {
      const orchestrator = getMemoryOrchestrator();
      memoryContext = await orchestrator.getContextInjection(userId);
    }

    const prompt = [
      "You are the Chairman model in an anonymous LLM council.",
      "Refine the rationale and fallback section only.",
      "Do not change chunk IDs or execution order.",
      memoryContext ? `\n${memoryContext}` : "",
      "Return strict JSON with keys: rationale (string), fallbacks (string[]).",
      `Current plan: ${JSON.stringify(plan)}`,
      `Opinions: ${JSON.stringify(opinions)}`,
      `Reviews: ${JSON.stringify(reviews)}`,
    ].join("\n");

    const raw = await this.askRaw(chairmanModel, prompt);
    const parsed = this.tryParseRefinement(raw);
    if (parsed) {
      return {
        ...plan,
        rationale: parsed.rationale || plan.rationale,
        fallbacks: Array.isArray(parsed.fallbacks) && parsed.fallbacks.length ? parsed.fallbacks : plan.fallbacks,
        chairmanModel,
      };
    }

    if (!this.isModelFailure(raw)) {
      return plan;
    }

    const fallbackModel = this.registry.councilModels.find((m) => m !== chairmanModel);
    if (!fallbackModel) {
      return {
        ...plan,
        rationale: `No answer: chairman '${chairmanModel}' failed and no fallback model is available. Reason: ${raw}`,
      };
    }

    const fallbackRaw = await this.askRaw(fallbackModel, prompt);
    const fallbackParsed = this.tryParseRefinement(fallbackRaw);
    if (!fallbackParsed) {
      return {
        ...plan,
        chairmanModel: fallbackModel,
        rationale: `No answer: chairman '${chairmanModel}' failed (${raw}). Fallback '${fallbackModel}' also failed (${fallbackRaw}).`,
      };
    }

    return {
      ...plan,
      rationale: `Chairman '${chairmanModel}' failed (${raw}). Switched to fallback '${fallbackModel}'. ${fallbackParsed.rationale || plan.rationale}`,
      fallbacks:
        Array.isArray(fallbackParsed.fallbacks) && fallbackParsed.fallbacks.length
          ? fallbackParsed.fallbacks
          : plan.fallbacks,
      chairmanModel: fallbackModel,
    };
  }

  private async askModel(model: string, task: TaskEnvelope, chunk: ChunkPlan): Promise<string> {
    // Get memory context if available
    const orchestrator = getMemoryOrchestrator();
    const memoryContext = await orchestrator.getContextInjection(task.userId, task.id);

    const prompt = [
      "You are part of an anonymous model council.",
      "Return a concise execution proposal for this chunk.",
      memoryContext ? `\n${memoryContext}` : "",
      `Task: ${task.text}`,
      `Chunk goal: ${chunk.goal}`,
      `Expected output: ${chunk.expectedOutput}`,
      "Format: 3-6 bullet points.",
    ].join("\n");

    return this.askRaw(model, prompt);
  }

  private async askRaw(model: string, prompt: string): Promise<string> {
    const env = getEnv();
    const apiKey = env.openRouterApiKey;
    if (!apiKey) {
      return `Model error (${model}): missing OPENROUTER_API_KEY`;
    }

    let lastError = "unknown";

    for (let attempt = 0; attempt <= env.openRouterMaxRetries; attempt += 1) {
      const response = await fetch(`${env.openRouterBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as OpenRouterResponse;
        return data.choices?.[0]?.message?.content?.trim() || `No content from ${model}`;
      }

      const text = await response.text();
      lastError = `${response.status} ${text.slice(0, 160)}`;
      if (attempt < env.openRouterMaxRetries) {
        await sleep(env.openRouterRetryBaseMs * (attempt + 1));
        continue;
      }
    }

    return `Model error (${model}) after retries: ${lastError}`;
  }

  private tryParseRefinement(raw: string): { rationale?: string; fallbacks?: string[] } | null {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const obj = JSON.parse(match[0]) as { rationale?: string; fallbacks?: string[] };
      return obj;
    } catch {
      return null;
    }
  }

  private isModelFailure(raw: string): boolean {
    const normalized = raw.toLowerCase();
    return normalized.includes("model error") || normalized.includes("no content");
  }
}
