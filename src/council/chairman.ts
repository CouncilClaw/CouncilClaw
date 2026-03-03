import type { ChairmanPlan, ChunkPlan, ModelOpinion, PeerReview } from "../types/contracts.js";

export function synthesizePlan(chunks: ChunkPlan[], _opinions: ModelOpinion[], _reviews: PeerReview[]): ChairmanPlan {
  return {
    finalChunks: chunks,
    executionOrder: chunks.map((c) => c.chunkId),
    parallelGroups: [chunks.map((c) => c.chunkId)],
    fallbacks: [],
    rationale: "Skeleton chairman selected decomposed chunks for execution.",
  };
}
