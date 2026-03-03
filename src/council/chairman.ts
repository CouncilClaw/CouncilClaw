import type { ChairmanPlan, ChunkPlan, ModelOpinion, PeerReview } from "../types/contracts.js";

function reviewScore(review: PeerReview): number {
  const { accuracy, feasibility, insight } = review.scores;
  return accuracy * 0.45 + feasibility * 0.35 + insight * 0.2;
}

export function synthesizePlan(chunks: ChunkPlan[], opinions: ModelOpinion[], reviews: PeerReview[]): ChairmanPlan {
  const scoreByProposal = new Map<string, number>();

  for (const opinion of opinions) scoreByProposal.set(opinion.proposalId, 0);
  for (const review of reviews) {
    scoreByProposal.set(review.targetProposalId, (scoreByProposal.get(review.targetProposalId) || 0) + reviewScore(review));
  }

  const best = [...scoreByProposal.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    finalChunks: chunks,
    executionOrder: chunks.map((c) => c.chunkId),
    parallelGroups: [chunks.map((c) => c.chunkId)],
    fallbacks: best ? [`Fallback: use next-ranked proposal if ${best[0]} fails validation.`] : [],
    rationale: best
      ? `Chairman selected ${best[0]} as lead basis from blind-review weighted scoring.`
      : "Chairman selected decomposed chunks (no review scores available).",
  };
}
