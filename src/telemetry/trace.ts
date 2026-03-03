import type { CouncilTrace, ModelOpinion, PeerReview } from "../types/contracts.js";

export function buildCouncilTrace(opinions: ModelOpinion[], reviews: PeerReview[]): CouncilTrace {
  return {
    summary: "Council completed first-pass + blind review + chairman synthesis.",
    winners: opinions.slice(0, 1).map((o) => o.proposalId),
    dissent: reviews.length ? undefined : "No dissent (single-model or no review).",
  };
}
