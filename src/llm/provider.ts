import type { ChunkPlan, ModelOpinion, TaskEnvelope } from "../types/contracts.js";
import { OpenRouterLlmProvider } from "./openrouter-client.js";

export interface LlmProvider {
  firstOpinions(task: TaskEnvelope, chunks: ChunkPlan[]): Promise<ModelOpinion[]>;
}

export function createLlmProvider(): LlmProvider {
  return new OpenRouterLlmProvider();
}
