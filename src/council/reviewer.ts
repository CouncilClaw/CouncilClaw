import type { ModelOpinion, PeerReview } from "../types/contracts.js";

export function runBlindReview(opinions: ModelOpinion[]): PeerReview[] {
  if (opinions.length < 2) return [];

  return opinions.flatMap((reviewer, idx) => {
    const target = opinions[(idx + 1) % opinions.length];
    return {
      reviewerAlias: reviewer.modelAlias,
      targetProposalId: target.proposalId,
      scores: { accuracy: 7, feasibility: 7, insight: 7 },
      critique: "Baseline review placeholder for v0.1 skeleton.",
      improvedAlternative: undefined,
    };
  });
}
