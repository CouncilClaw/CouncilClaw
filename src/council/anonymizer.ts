import type { ModelOpinion } from "../types/contracts.js";

export function anonymizeOpinions(opinions: ModelOpinion[]): ModelOpinion[] {
  return opinions.map((o, i) => ({ ...o, modelAlias: `M${i + 1}` }));
}
