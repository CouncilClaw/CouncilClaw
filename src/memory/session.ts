/**
 * Session Manager
 * Manages user sessions, conversation continuity, and session-based memory
 */

import { logger } from "../telemetry/logger.js";
import { getMemoryStore } from "./store.js";
import type { UserSession, ConversationMessage } from "./types.js";

interface SessionOptions {
  userId: string;
  channel: string;
  reuseExistingSession?: boolean;
}

class SessionManager {
  private activeSessions: Map<string, UserSession> = new Map();
  private sessionsByUser: Map<string, string[]> = new Map();

  async initializeSession(options: SessionOptions): Promise<UserSession> {
    const store = getMemoryStore();

    // Check for existing active session if reuse is enabled
    if (options.reuseExistingSession) {
      const existingSessionId = await this.findActiveSession(options.userId, options.channel);
      if (existingSessionId) {
        const session = this.activeSessions.get(existingSessionId);
        if (session) {
          await store.updateSessionActivity(existingSessionId);
          logger.info("session-manager", "Reused existing session", {
            sessionId: existingSessionId,
            userId: options.userId,
          });
          return session;
        }
      }
    }

    // Create new session
    const session = await store.startSession(options.userId, options.channel);
    this.activeSessions.set(session.id, session);

    // Track session by user
    const userSessions = this.sessionsByUser.get(options.userId) || [];
    userSessions.push(session.id);
    this.sessionsByUser.set(options.userId, userSessions);

    logger.info("session-manager", "New session created", {
      sessionId: session.id,
      userId: options.userId,
      channel: options.channel,
    });

    return session;
  }

  async addMessageToSession(
    sessionId: string,
    role: "user" | "council" | "chairman" | "reviewer" | "system",
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<ConversationMessage> {
    const store = getMemoryStore();
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const message = await store.storeMessage({
      userId: session.userId,
      sessionId,
      role,
      content,
      metadata,
    });

    await store.updateSessionActivity(sessionId);

    return message;
  }

  async getSessionHistory(sessionId: string, limit: number = 20): Promise<ConversationMessage[]> {
    const store = getMemoryStore();
    return store.getConversationHistory(sessionId, limit);
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (session) {
      session.archived = true;
      logger.info("session-manager", "Session closed", {
        sessionId,
        userId: session.userId,
        messageCount: session.messageCount,
      });
    }

    this.activeSessions.delete(sessionId);
  }

  async getSessionStats(sessionId: string): Promise<{
    messageCount: number;
    startedAt: string;
    lastActivityAt: string;
    durationMs: number;
  } | null> {
    const session = this.activeSessions.get(sessionId);

    if (!session) return null;

    const startTime = new Date(session.startedAt).getTime();
    const lastActivityTime = new Date(session.lastActivityAt).getTime();

    return {
      messageCount: session.messageCount,
      startedAt: session.startedAt,
      lastActivityAt: session.lastActivityAt,
      durationMs: lastActivityTime - startTime,
    };
  }

  /**
   * Find an active session for a user on a given channel
   */
  private async findActiveSession(userId: string, channel: string): Promise<string | null> {
    const userSessions = this.sessionsByUser.get(userId) || [];

    for (const sessionId of userSessions) {
      const session = this.activeSessions.get(sessionId);
      if (session && session.channel === channel && !session.archived) {
        return sessionId;
      }
    }

    return null;
  }

  /**
   * Get all active sessions for a user
   */
  getActiveSessionsForUser(userId: string): UserSession[] {
    const sessionIds = this.sessionsByUser.get(userId) || [];
    const sessions: UserSession[] = [];

    for (const sessionId of sessionIds) {
      const session = this.activeSessions.get(sessionId);
      if (session && !session.archived) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Get information about a specific session
   */
  getSession(sessionId: string): UserSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all currently active sessions
   */
  getAllActiveSessions(): UserSession[] {
    return Array.from(this.activeSessions.values()).filter((s) => !s.archived);
  }
}

let managerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!managerInstance) {
    managerInstance = new SessionManager();
  }
  return managerInstance;
}

export { SessionManager };
