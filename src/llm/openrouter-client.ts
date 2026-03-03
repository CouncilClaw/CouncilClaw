import type { ChunkPlan, ModelOpinion, TaskEnvelope } from "../types/contracts.js";
import type { LlmProvider } from "./provider.js";
import { loadModelRegistry } from "./model-registry.js";

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export class OpenRouterLlmProvider implements LlmProvider {
  private readonly apiKey = process.env.OPENROUTER_API_KEY?.trim();
  private readonly baseUrl = process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1";
  private readonly registry = loadModelRegistry();

  async firstOpinions(task: TaskEnvelope, chunks: ChunkPlan[]): Promise<ModelOpinion[]> {
    if (!this.apiKey) {
      return chunks.map((chunk, i) => ({
        proposalId: `proposal-stub-${i + 1}`,
        modelAlias: this.registry.councilModels[i % this.registry.councilModels.length] || `model-${i + 1}`,
        chunkId: chunk.chunkId,
        proposal: `Stub response (no OPENROUTER_API_KEY) for chunk: ${chunk.goal}`,
        confidence: 0.45,
      }));
    }

    const opinions: ModelOpinion[] = [];

    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      const model = this.registry.councilModels[i % this.registry.councilModels.length];
      const content = await this.askModel(model, task, chunk);

      opinions.push({
        proposalId: `proposal-${i + 1}`,
        modelAlias: model,
        chunkId: chunk.chunkId,
        proposal: content,
        confidence: 0.7,
      });
    }

    return opinions;
  }

  private async askModel(model: string, task: TaskEnvelope, chunk: ChunkPlan): Promise<string> {
    const prompt = [
      "You are part of an anonymous model council.",
      "Return a concise execution proposal for this chunk.",
      `Task: ${task.text}`,
      `Chunk goal: ${chunk.goal}`,
      `Expected output: ${chunk.expectedOutput}`,
      "Format: 3-6 bullet points.",
    ].join("\n");

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return `Model error (${model}): ${response.status} ${text.slice(0, 200)}`;
    }

    const data = (await response.json()) as OpenRouterResponse;
    return data.choices?.[0]?.message?.content?.trim() || `No content from ${model}`;
  }
}
