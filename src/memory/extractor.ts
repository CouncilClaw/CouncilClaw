/**
 * Memory Fact Extractor
 * Automatically extracts important facts from conversations and council decisions
 * Uses heuristics and pattern matching to identify decisions, preferences, constraints, etc.
 */

import { logger } from "../telemetry/logger.js";
import type { CouncilRunResult, TaskEnvelope } from "../types/contracts.js";
import type { MemoryFact } from "./types.js";

interface ExtractionContext {
  taskId: string;
  userId: string;
  text: string;
  modelResponses?: string[];
  dissent?: string;
}

class FactExtractor {
  /**
   * Extract facts from a user query and council response
   */
  async extractFromCouncilRun(
    task: TaskEnvelope,
    result: CouncilRunResult,
  ): Promise<MemoryFact[]> {
    const facts: MemoryFact[] = [];

    // Extract decisions
    const decisions = this.extractDecisions(
      task.text,
      result.trace?.summary || "",
    );
    for (const decision of decisions) {
      facts.push({
        id: "",
        userId: task.userId,
        content: decision,
        category: "decision",
        confidence: 0.85,
        source: "extraction",
        extractedFrom: task.id,
        createdAt: "",
        updatedAt: "",
        tags: ["council-decision"],
      });
    }

    // Extract constraints mentioned
    const constraints = this.extractConstraints(task.text);
    for (const constraint of constraints) {
      facts.push({
        id: "",
        userId: task.userId,
        content: constraint,
        category: "constraint",
        confidence: 0.8,
        source: "extraction",
        extractedFrom: task.id,
        createdAt: "",
        updatedAt: "",
        tags: ["user-constraint"],
      });
    }

    // Extract learnings from council dissent
    if (result.trace?.dissent) {
      const learning = `Alternative perspective during ${task.text.substring(0, 50)}: ${result.trace.dissent}`;
      facts.push({
        id: "",
        userId: task.userId,
        content: learning,
        category: "learning",
        confidence: 0.7,
        source: "extraction",
        extractedFrom: task.id,
        createdAt: "",
        updatedAt: "",
        tags: ["council-learning", "dissent"],
      });
    }

    // Extract error patterns for future avoidance
    if (result.reports && result.reports.length > 0) {
      for (const report of result.reports) {
        if (report.errors && report.errors.length > 0) {
          for (const error of report.errors) {
            facts.push({
              id: "",
              userId: task.userId,
              content: `Error pattern: ${error} (task: ${task.text.substring(0, 30)})`,
              category: "error",
              confidence: 0.75,
              source: "extraction",
              extractedFrom: task.id,
              createdAt: "",
              updatedAt: "",
              tags: ["execution-error"],
            });
          }
        }
      }
    }

    logger.debug("fact-extractor", "Extracted facts from council run", {
      taskId: task.id,
      factCount: facts.length,
    });

    return facts;
  }

  /**
   * Extract facts from free-form user input/preference
   */
  extractFromUserInput(
    userId: string,
    input: string,
    type: "preference" | "context" = "preference",
  ): MemoryFact[] {
    const facts: MemoryFact[] = [];

    // Match preference patterns like "I prefer X", "I don't like Y", "I always use Z"
    const preferencePatterns = [
      /i\s+(?:prefer|like)\s+([^.,!?]+)/gi,
      /i\s+(?:don't|do not)\s+like\s+([^.,!?]+)/gi,
      /i\s+(?:always|usually)\s+([^.,!?]+)/gi,
      /(?:my|our)\s+(?:preferred|favorite)\s+([^.,!?]+)/gi,
    ];

    for (const pattern of preferencePatterns) {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        facts.push({
          id: "",
          userId,
          content: `Preference: ${match[1].trim()}`,
          category: type === "preference" ? "preference" : "context",
          confidence: 0.7,
          source: "extraction",
          extractedFrom: "user_input",
          createdAt: "",
          updatedAt: "",
          tags: ["user-preference"],
        });
      }
    }

    return facts;
  }

  /**
   * Extract specific decision statements from text
   */
  private extractDecisions(_userQuery: string, councilResponse: string): string[] {
    const decisions: string[] = [];

    // Pattern matching for common decision phrases
    const decisionPatterns = [
      /(?:decided to|will|should)\s+([^.,!?]+)/gi,
      /the\s+(?:best|optimal|recommended)\s+(?:approach|solution|action)\s+is\s+([^.,!?]+)/gi,
      /final\s+(?:decision|plan|answer):\s*([^.,!?]+)/gi,
    ];

    for (const pattern of decisionPatterns) {
      let match;
      while ((match = pattern.exec(councilResponse)) !== null) {
        const decision = match[1].trim();
        if (decision.length > 10 && decision.length < 200) {
          decisions.push(`Decision: ${decision}`);
        }
      }
    }

    return decisions;
  }

  /**
   * Extract constraints, requirements, or limitations mentioned
   */
  private extractConstraints(text: string): string[] {
    const constraints: string[] = [];

    const constraintPatterns = [
      /(?:must|should|cannot|do not)\s+([^.,!?]+)/gi,
      /(?:constraint|requirement|limitation):\s*([^.,!?]+)/gi,
      /(?:only|limited to|restricted to)\s+([^.,!?]+)/gi,
      /within\s+(?:budget|time|resources)\s+of\s+([^.,!?]+)/gi,
    ];

    for (const pattern of constraintPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const constraint = match[1].trim();
        if (constraint.length > 5 && constraint.length < 150) {
          constraints.push(`Constraint: ${constraint}`);
        }
      }
    }

    return constraints;
  }

  /**
   * Extract key entities (names, tools, commands) from conversation
   */
  extractEntities(text: string): { tools: string[]; mentions: string[] } {
    const tools: string[] = [];
    const mentions: string[] = [];

    // Common tools/services mentioned
    const toolPatterns = [
      /(?:using|with|via)\s+(?:the\s+)?([a-z0-9\-_]+)/gi,
      /(?:npm|pip|apt-get|docker|git|kubectl)\s+([^\s]+)/gi,
    ];

    for (const pattern of toolPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const tool = match[1].toLowerCase().trim();
        if (!tools.includes(tool) && tool.length < 50) {
          tools.push(tool);
        }
      }
    }

    // Named entity extraction (simple)
    const entityPatterns = [
      /(?:the|a)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /user\s+(?:name|id|email):\s*([^\s,]+)/gi,
    ];

    for (const pattern of entityPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const entity = match[1].trim();
        if (!mentions.includes(entity) && entity.length < 50) {
          mentions.push(entity);
        }
      }
    }

    return { tools, mentions };
  }

  /**
   * Summarize a conversation into key points for memory
   */
  summarizeConversation(messages: string[]): string {
    if (messages.length === 0) return "";

    // Take first query and last response as summary
    const summary = [messages[0].substring(0, 100)];

    if (messages.length > 1) {
      summary.push(messages[messages.length - 1].substring(0, 100));
    }

    return summary.join(" → ");
  }

  /**
   * Determine confidence score for an extracted fact based on context
   */
  scoreConfidence(
    fact: string,
    context: ExtractionContext,
  ): number {
    let score = 0.5; // Base score

    // Higher confidence if fact appears multiple times
    const occurrences = (context.text.match(new RegExp(fact.split(" ")[0], "gi")) || []).length;
    score += occurrences * 0.05;

    // Higher confidence if from multiple model agreement
    if (context.modelResponses) {
      const matches = context.modelResponses.filter((r) =>
        r.toLowerCase().includes(fact.toLowerCase()),
      ).length;
      score += (matches / context.modelResponses.length) * 0.2;
    }

    // Decay if from dissent
    if (context.dissent?.includes(fact)) {
      score -= 0.15;
    }

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, score));
  }
}

// Singleton instance
let extractorInstance: FactExtractor | null = null;

export function getFactExtractor(): FactExtractor {
  if (!extractorInstance) {
    extractorInstance = new FactExtractor();
  }
  return extractorInstance;
}

export { FactExtractor };
