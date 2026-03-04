/**
 * Memory System Types for CouncilClaw
 * Defines schemas for conversation history, facts, and user context
 */

export interface MemoryFact {
  id: string;
  userId: string;
  content: string;
  category: "decision" | "preference" | "constraint" | "learning" | "context" | "error";
  confidence: number; // 0-1 score of how important/reliable this fact is
  source: "extraction" | "user_input" | "system";
  extractedFrom: string; // reference to taskId or conversationId
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface ConversationMessage {
  id: string;
  userId: string;
  sessionId: string;
  role: "user" | "council" | "chairman" | "reviewer" | "system";
  content: string;
  metadata?: {
    modelAlias?: string;
    confidence?: number;
    phase?: string;
  };
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  channel: string;
  startedAt: string;
  lastActivityAt: string;
  messageCount: number;
  archived: boolean;
}

export interface MemoryContext {
  relevantFacts: MemoryFact[];
  recentConversations: ConversationMessage[];
  userPreferences: Record<string, string | number | boolean>;
  sessionSummary: string;
}

export interface MemoryQueryOptions {
  userId: string;
  sessionId?: string;
  limit?: number;
  categories?: MemoryFact["category"][];
  tags?: string[];
  minConfidence?: number;
}

export interface MemoryStoreConfig {
  storePath: string;
  maxFactsPerUser: number;
  maxMessagesPerSession: number;
  conversationRetentionDays: number;
  autoCleanupEnabled: boolean;
}

export interface ExtractedFacts {
  decisions: string[];
  preferences: string[];
  constraints: string[];
  learnings: string[];
}
