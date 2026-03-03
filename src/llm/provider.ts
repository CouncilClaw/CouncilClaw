import type { ChunkPlan, ModelOpinion, TaskEnvelope } from "../types/contracts.js";

export interface LlmProvider {
  firstOpinions(task: TaskEnvelope, chunks: ChunkPlan[]): Promise<ModelOpinion[]>;
}

export class StubLlmProvider implements LlmProvider {
  async firstOpinions(_task: TaskEnvelope, chunks: ChunkPlan[]): Promise<ModelOpinion[]> {
    return chunks.map((chunk, i) => ({
      proposalId: `proposal-${i + 1}`,
      modelAlias: `raw-model-${i + 1}`,
      chunkId: chunk.chunkId,
      proposal: `Stub proposal for ${chunk.goal}`,
      confidence: 0.7,
    }));
  }
}
