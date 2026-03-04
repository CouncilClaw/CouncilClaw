/**
 * Memory System Index
 * Exports all memory-related modules and utilities
 */

export { getMemoryStore, initializeMemoryStore, MemoryStore } from "./store.js";
export { getFactExtractor, FactExtractor } from "./extractor.js";
export { getContextBuilder, MemoryContextBuilder } from "./context.js";
export { getSessionManager, SessionManager } from "./session.js";

export type {
  MemoryFact,
  ConversationMessage,
  UserSession,
  MemoryContext,
  MemoryQueryOptions,
  MemoryStoreConfig,
  ExtractedFacts,
} from "./types.js";

// Memory system orchestrator
import { logger } from "../telemetry/logger.js";
import { getMemoryStore } from "./store.js";
import { getFactExtractor } from "./extractor.js";
import { getContextBuilder } from "./context.js";
import { getSessionManager } from "./session.js";
import type { TaskEnvelope, CouncilRunResult } from "../types/contracts.js";
import type { MemoryContext } from "./types.js";

/**
 * Main memory orchestrator for the council system
 */
export class MemoryOrchestrator {
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      const store = getMemoryStore();
      await store.initialize();
      this.initialized = true;
      logger.info("memory-orchestrator", "Memory system initialized");
    } catch (error) {
      logger.error(
        "memory-orchestrator",
        "Failed to initialize memory system",
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Record a council run and extract facts for future reference
   */
  async recordCouncilRun(task: TaskEnvelope, result: CouncilRunResult): Promise<void> {
    if (!this.initialized) return;

    try {
      const store = getMemoryStore();
      const extractor = getFactExtractor();

      // Extract and store facts from council decision
      const facts = await extractor.extractFromCouncilRun(task, result);
      for (const fact of facts) {
        await store.storeFact({
          userId: task.userId,
          content: fact.content,
          category: fact.category,
          confidence: fact.confidence,
          source: fact.source,
          extractedFrom: fact.extractedFrom,
          tags: fact.tags,
        });
      }

      logger.debug("memory-orchestrator", "Council run recorded", {
        taskId: task.id,
        factsStored: facts.length,
      });
    } catch (error) {
      logger.error(
        "memory-orchestrator",
        "Failed to record council run",
        error instanceof Error ? error : new Error(String(error)),
        {
          taskId: task.id,
        }
      );
      // Don't throw - memory failures shouldn't break the main flow
    }
  }

  /**
   * Get memory context for a user to augment council deliberation
   */
  async getMemoryContext(userId: string, sessionId?: string): Promise<MemoryContext | null> {
    if (!this.initialized) return null;

    try {
      const store = getMemoryStore();
      return store.buildContext(userId, sessionId);
    } catch (error) {
      logger.error(
        "memory-orchestrator",
        "Failed to build memory context",
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
      return null;
    }
  }

  /**
   * Get context injection string for model prompts
   */
  async getContextInjection(userId: string, sessionId?: string): Promise<string> {
    if (!this.initialized) return "";

    const context = await this.getMemoryContext(userId, sessionId);
    const builder = getContextBuilder();
    return builder.buildContextInjection(context);
  }

  /**
   * Enrich a model prompt with memory context
   */
  async enrichPrompt(
    basePrompt: string,
    userId: string,
    sessionId?: string,
  ): Promise<string> {
    if (!this.initialized) return basePrompt;

    const context = await this.getMemoryContext(userId, sessionId);
    const builder = getContextBuilder();
    return builder.createAugmentedSystemPrompt(basePrompt, context);
  }

  /**
   * Get a summary of what the system knows about a user
   */
  async getUserProfile(userId: string, sessionId?: string) {
    if (!this.initialized) return null;

    const context = await this.getMemoryContext(userId, sessionId);
    if (!context) return null;

    const builder = getContextBuilder();
    return builder.buildUserProfile(context);
  }

  /**
   * Get memory store statistics
   */
  async getStats() {
    if (!this.initialized) return null;
    const store = getMemoryStore();
    return store.getSummary();
  }
}

// Singleton instance
let orchestratorInstance: MemoryOrchestrator | null = null;

export function getMemoryOrchestrator(): MemoryOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new MemoryOrchestrator();
  }
  return orchestratorInstance;
}
