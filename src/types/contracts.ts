export type Channel = "telegram" | "discord" | "whatsapp" | "slack" | "email" | "unknown";

export interface TaskEnvelope {
  id: string;
  userId: string;
  channel: Channel;
  text: string;
  attachments?: string[];
  createdAt: string;
}

export interface ComplexityDecision {
  label: "simple" | "complex";
  score: number;
  reason: string;
}

export interface ChunkPlan {
  chunkId: string;
  goal: string;
  inputs: string[];
  expectedOutput: string;
  riskLevel: "low" | "medium" | "high";
}

export interface ModelOpinion {
  proposalId: string;
  modelAlias: string;
  chunkId: string;
  proposal: string;
  confidence: number;
}

export interface PeerReview {
  reviewerAlias: string;
  targetProposalId: string;
  scores: {
    accuracy: number;
    feasibility: number;
    insight: number;
  };
  critique: string;
  improvedAlternative?: string;
}

export interface ChairmanPlan {
  finalChunks: ChunkPlan[];
  executionOrder: string[];
  parallelGroups: string[][];
  fallbacks: string[];
  rationale: string;
}

export interface ExecutionReport {
  chunkId: string;
  status: "success" | "failed" | "skipped";
  artifacts: string[];
  tests: string[];
  errors: string[];
  durationMs: number;
}

export interface CouncilTrace {
  summary: string;
  winners: string[];
  dissent?: string;
}

export interface CouncilRunResult {
  decision: ComplexityDecision;
  chairmanPlan: ChairmanPlan;
  reports: ExecutionReport[];
  trace: CouncilTrace;
}
