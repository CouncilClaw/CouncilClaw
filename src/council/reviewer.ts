import type { ModelOpinion, PeerReview } from "../types/contracts.js";

function scoreProposal(proposal: string): number {
  const len = proposal.length;
  if (len < 80) return 5;
  if (len < 180) return 7;
  return 8;
}

export function runBlindReview(opinions: ModelOpinion[]): PeerReview[] {
  if (opinions.length < 2) return [];

  return opinions.map((reviewer, idx) => {
    const target = opinions[(idx + 1) % opinions.length];
    const base = scoreProposal(target.proposal);

    return {
      reviewerAlias: reviewer.modelAlias,
      targetProposalId: target.proposalId,
      scores: {
        accuracy: base,
        feasibility: Math.max(5, base - 1),
        insight: Math.min(9, base + 1),
      },
      critique: `Proposal ${target.proposalId} seems ${base >= 7 ? "solid" : "underdeveloped"}; verify edge cases before execution.`,
      improvedAlternative: base < 7 ? `Expand ${target.proposalId} with explicit validation and rollback steps.` : undefined,
    };
  });
}
