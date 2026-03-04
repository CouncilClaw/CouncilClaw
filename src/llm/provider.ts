import type { ChairmanPlan, ChunkPlan, ModelOpinion, PeerReview, TaskEnvelope } from "../types/contracts.js";
import { OpenRouterLlmProvider } from "./openrouter-client.js";

export interface LlmProvider {
  firstOpinions(task: TaskEnvelope, chunks: ChunkPlan[]): Promise<ModelOpinion[]>;
  chairmanRefine(
    chairmanModel: string,
    plan: ChairmanPlan,
    opinions: ModelOpinion[],
    reviews: PeerReview[],
    userId?: string,
  ): Promise<ChairmanPlan>;
}

export function createLlmProvider(): LlmProvider {
  return new OpenRouterLlmProvider();
}
