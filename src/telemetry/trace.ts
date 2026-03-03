import type { CouncilTrace, ModelOpinion, PeerReview } from "../types/contracts.js";

export function buildCouncilTrace(
  opinions: ModelOpinion[],
  reviews: PeerReview[],
  selectedChairmanModel: string,
  dissent?: string,
): CouncilTrace {
  return {
    summary: "Council completed first-pass + blind review + chairman synthesis.",
    winners: opinions.slice(0, 1).map((o) => o.proposalId),
    dissent,
    selectedChairmanModel,
  };
}
