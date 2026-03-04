/**
 * Memory Store
 * Manages persistent storage and retrieval of conversation history and extracted facts
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { logger } from "../telemetry/logger.js";
import type {
  MemoryFact,
  ConversationMessage,
  UserSession,
  MemoryStoreConfig,
  MemoryQueryOptions,
  MemoryContext,
} from "./types.js";

const DEFAULT_CONFIG: MemoryStoreConfig = {
  storePath: join(process.env.HOME || "/tmp", ".config/councilclaw/memory"),
  maxFactsPerUser: 1000,
  maxMessagesPerSession: 500,
  conversationRetentionDays: 90,
  autoCleanupEnabled: true,
};

class MemoryStore {
  private config: MemoryStoreConfig;
  private factsCache: Map<string, MemoryFact[]> = new Map();
  private messagesCache: Map<string, ConversationMessage[]> = new Map();
  private sessionsCache: Map<string, UserSession> = new Map();

  constructor(config: Partial<MemoryStoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.config.storePath, { recursive: true });
      await this.loadCaches();
      if (this.config.autoCleanupEnabled) {
        await this.cleanupOldData();
      }
      logger.info("memory-store", "Memory store initialized", {
        path: this.config.storePath,
      });
    } catch (error) {
      logger.error(
        "memory-store",
        "Failed to initialize memory store",
        error instanceof Error ? error : new Error(String(error)),
        {
          path: this.config.storePath,
        }
      );
      throw error;
    }
  }

  async storeFact(fact: Omit<MemoryFact, "id" | "createdAt" | "updatedAt">): Promise<MemoryFact> {
    const newFact: MemoryFact = {
      ...fact,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const key = `facts:${newFact.userId}`;
    let userFacts = this.factsCache.get(key) || [];

    // Enforce max facts limit
    if (userFacts.length >= this.config.maxFactsPerUser) {
      userFacts = userFacts.slice(-this.config.maxFactsPerUser + 1);
    }

    userFacts.push(newFact);
    this.factsCache.set(key, userFacts);

    await this.persistFacts(newFact.userId, userFacts);
    logger.debug("memory-store", "Fact stored", { factId: newFact.id, userId: newFact.userId });

    return newFact;
  }

  async storeMessage(message: Omit<ConversationMessage, "id" | "createdAt">): Promise<ConversationMessage> {
    const newMessage: ConversationMessage = {
      ...message,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const key = `messages:${newMessage.sessionId}`;
    let sessionMessages = this.messagesCache.get(key) || [];

    if (sessionMessages.length >= this.config.maxMessagesPerSession) {
      sessionMessages = sessionMessages.slice(-this.config.maxMessagesPerSession + 1);
    }

    sessionMessages.push(newMessage);
    this.messagesCache.set(key, sessionMessages);

    await this.persistMessages(newMessage.sessionId, sessionMessages);
    logger.debug("memory-store", "Message stored", { messageId: newMessage.id });

    return newMessage;
  }

  async startSession(userId: string, channel: string): Promise<UserSession> {
    const session: UserSession = {
      id: randomUUID(),
      userId,
      channel,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      messageCount: 0,
      archived: false,
    };

    this.sessionsCache.set(session.id, session);
    await this.persistSession(session);

    logger.debug("memory-store", "Session started", { sessionId: session.id, userId });
    return session;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = this.sessionsCache.get(sessionId);
    if (session) {
      session.lastActivityAt = new Date().toISOString();
      session.messageCount++;
      await this.persistSession(session);
    }
  }

  async queryFacts(options: MemoryQueryOptions): Promise<MemoryFact[]> {
    const key = `facts:${options.userId}`;
    let facts = this.factsCache.get(key) || [];

    // Filter by category
    if (options.categories && options.categories.length > 0) {
      facts = facts.filter((f) => options.categories!.includes(f.category));
    }

    // Filter by confidence
    if (options.minConfidence !== undefined) {
      facts = facts.filter((f) => f.confidence >= options.minConfidence!);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      facts = facts.filter((f) => options.tags!.some((tag) => f.tags.includes(tag)));
    }

    // Sort by confidence and recency
    facts = facts.sort((a, b) => {
      const confDiff = b.confidence - a.confidence;
      if (confDiff !== 0) return confDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return facts.slice(0, options.limit || 10);
  }

  async getConversationHistory(
    sessionId: string,
    limit: number = 20,
  ): Promise<ConversationMessage[]> {
    const key = `messages:${sessionId}`;
    const messages = this.messagesCache.get(key) || [];
    return messages.slice(-limit);
  }

  async buildContext(userId: string, sessionId?: string): Promise<MemoryContext> {
    const relevantFacts = await this.queryFacts({
      userId,
      limit: 10,
      minConfidence: 0.5,
    });

    const recentConversations = sessionId
      ? await this.getConversationHistory(sessionId, 10)
      : [];

    const userPreferences: Record<string, string | number | boolean> = {};
    relevantFacts
      .filter((f) => f.category === "preference")
      .forEach((f) => {
        const match = f.content.match(/(\w+):\s*(.+)/);
        if (match) {
          userPreferences[match[1]] = match[2];
        }
      });

    const sessionSummary =
      relevantFacts
        .filter((f) => f.category === "learning" || f.category === "decision")
        .map((f) => f.content)
        .join(" | ") || "No prior context available";

    return {
      relevantFacts,
      recentConversations,
      userPreferences,
      sessionSummary,
    };
  }

  private async loadCaches(): Promise<void> {
    try {
      const entries = await fs.readdir(this.config.storePath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile()) {
          const content = await fs.readFile(
            join(this.config.storePath, entry.name),
            "utf-8",
          );
          try {
            const data = JSON.parse(content);
            if (entry.name.startsWith("facts_")) {
              this.factsCache.set(`facts:${entry.name.replace("facts_", "").replace(".json", "")}`, data);
            } else if (entry.name.startsWith("messages_")) {
              this.messagesCache.set(
                `messages:${entry.name.replace("messages_", "").replace(".json", "")}`,
                data,
              );
            } else if (entry.name.startsWith("session_")) {
              this.sessionsCache.set(entry.name.replace("session_", "").replace(".json", ""), data);
            }
          } catch {
            logger.warn("memory-store", "Failed to parse cache file", { file: entry.name });
          }
        }
      }

      logger.debug("memory-store", "Caches loaded", { itemCount: this.factsCache.size });
    } catch (error) {
      logger.warn("memory-store", "Failed to load caches", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async persistFacts(userId: string, facts: MemoryFact[]): Promise<void> {
    const filePath = join(this.config.storePath, `facts_${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(facts, null, 2));
  }

  private async persistMessages(sessionId: string, messages: ConversationMessage[]): Promise<void> {
    const filePath = join(this.config.storePath, `messages_${sessionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(messages, null, 2));
  }

  private async persistSession(session: UserSession): Promise<void> {
    const filePath = join(this.config.storePath, `session_${session.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(session, null, 2));
  }

  private async cleanupOldData(): Promise<void> {
    const now = Date.now();
    const retentionMs = this.config.conversationRetentionDays * 24 * 60 * 60 * 1000;

    for (const [key, messages] of this.messagesCache.entries()) {
      const filtered = messages.filter((m) => now - new Date(m.createdAt).getTime() < retentionMs);

      if (filtered.length < messages.length) {
        this.messagesCache.set(key, filtered);
        const sessionId = key.replace("messages:", "");
        await this.persistMessages(sessionId, filtered);
        logger.debug("memory-store", "Cleaned up old messages", {
          sessionId,
          removed: messages.length - filtered.length,
        });
      }
    }
  }

  async getSummary(): Promise<{ totalFacts: number; totalSessions: number; totalMessages: number }> {
    let totalFacts = 0;
    let totalMessages = 0;

    for (const facts of this.factsCache.values()) {
      totalFacts += facts.length;
    }

    for (const messages of this.messagesCache.values()) {
      totalMessages += messages.length;
    }

    return {
      totalFacts,
      totalSessions: this.sessionsCache.size,
      totalMessages,
    };
  }
}

// Singleton instance
let storeInstance: MemoryStore | null = null;

export function getMemoryStore(config?: Partial<MemoryStoreConfig>): MemoryStore {
  if (!storeInstance) {
    storeInstance = new MemoryStore(config);
  }
  return storeInstance;
}

export async function initializeMemoryStore(config?: Partial<MemoryStoreConfig>): Promise<MemoryStore> {
  const store = getMemoryStore(config);
  await store.initialize();
  return store;
}

export { MemoryStore };
