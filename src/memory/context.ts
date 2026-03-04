/**
 * Memory Context Builder
 * Constructs contextual information from memory to enhance council deliberations
 * Provides memory-augmented prompts that incorporate past decisions and user preferences
 */

import { logger } from "../telemetry/logger.js";
import type { MemoryContext, MemoryFact } from "./types.js";

class MemoryContextBuilder {
  /**
   * Build a context injection string for model prompts
   */
  buildContextInjection(context: MemoryContext | null): string {
    if (!context || !context.relevantFacts || context.relevantFacts.length === 0) {
      return "";
    }

    const sections: string[] = [];

    // Add recent context if available
    if (context.sessionSummary) {
      sections.push(`# Recent Context\n${context.sessionSummary}`);
    }

    // Group facts by category
    const groupedFacts = this.groupFactsByCategory(context.relevantFacts);

    // Add decisions
    if (groupedFacts.decisions.length > 0) {
      sections.push(
        `# Previous Decisions\n${this.formatFactList(groupedFacts.decisions)}`,
      );
    }

    // Add constraints
    if (groupedFacts.constraints.length > 0) {
      sections.push(
        `# Known Constraints\n${this.formatFactList(groupedFacts.constraints)}`,
      );
    }

    // Add preferences
    if (groupedFacts.preferences.length > 0) {
      sections.push(
        `# User Preferences\n${this.formatFactList(groupedFacts.preferences)}`,
      );
    }

    // Add learnings from past dissent
    if (groupedFacts.learnings.length > 0) {
      sections.push(
        `# Alternative Perspectives from Past\n${this.formatFactList(groupedFacts.learnings)}`,
      );
    }

    if (sections.length === 0) return "";

    return `## Memory-Augmented Context
${sections.join("\n\n")}

Please consider this context while formulating your response, as it reflects this user's patterns, preferences, and past decisions.

`;
  }

  /**
   * Build context for a specific model to receive
   */
  buildModelContext(
    fullContext: MemoryContext | null,
    modelAlias: string,
  ): string {
    if (!fullContext) return "";

    // Customize context based on model's role
    const roleHint = this.getRoleHint(modelAlias);
    const relevantFacts = this.filterFactsForModel(fullContext.relevantFacts, modelAlias);

    if (relevantFacts.length === 0) return "";

    return `
## User Context & History
${this.formatFactList(relevantFacts)}

## Guidance
${roleHint}

Remember to:
- Consider this user's past preferences and decisions
- Respect any constraints they've mentioned previously
- Learn from alternative perspectives in council history
`;
  }

  /**
   * Get a role-specific hint for the model
   */
  private getRoleHint(modelAlias: string): string {
    const hints: Record<string, string> = {
      chairman:
        "As the chairman, synthesize these historical patterns into a coherent decision that respects past preferences.",
      reviewer:
        "As a reviewer, consider how previous decisions and constraints should inform your critique.",
      default:
        "Use this context to provide responses that align with this user's known preferences and decisions.",
    };

    return hints[modelAlias] || hints.default;
  }

  /**
   * Filter facts most relevant to a specific model
   */
  private filterFactsForModel(facts: MemoryFact[], modelAlias: string): MemoryFact[] {
    // Prioritize different categories based on model role
    const isChairman = modelAlias.toLowerCase().includes("chairman");
    const isReviewer = modelAlias.toLowerCase().includes("review");

    let filtered = facts;

    if (isChairman) {
      // Chairman benefits most from decisions and preferences
      filtered = filtered.filter(
        (f) =>
          f.category === "decision" ||
          f.category === "preference" ||
          f.category === "constraint",
      );
    } else if (isReviewer) {
      // Reviewers benefit from constraints and error patterns
      filtered = filtered.filter(
        (f) => f.category === "constraint" || f.category === "error" || f.category === "learning",
      );
    }

    // Return top 5 most relevant facts
    return filtered.slice(0, 5);
  }

  /**
   * Format a list of facts for inclusion in prompts
   */
  private formatFactList(facts: MemoryFact[]): string {
    if (facts.length === 0) return "No relevant context available.";

    return facts
      .map((fact) => {
        const confidence =
          fact.confidence >= 0.8
            ? "✓ High confidence"
            : fact.confidence >= 0.6
              ? "~ Medium confidence"
              : "? Lower confidence";

        return `- ${fact.content} [${confidence}]`;
      })
      .join("\n");
  }

  /**
   * Group facts by category
   */
  private groupFactsByCategory(facts: MemoryFact[]) {
    return {
      decisions: facts.filter((f) => f.category === "decision"),
      preferences: facts.filter((f) => f.category === "preference"),
      constraints: facts.filter((f) => f.category === "constraint"),
      learnings: facts.filter((f) => f.category === "learning"),
      errors: facts.filter((f) => f.category === "error"),
      context: facts.filter((f) => f.category === "context"),
    };
  }

  /**
   * Build a summary of what the system knows about a user
   */
  buildUserProfile(context: MemoryContext): {
    knownPreferences: string[];
    knownConstraints: string[];
    recentDecisions: string[];
    errorPatterns: string[];
  } {
    const grouped = this.groupFactsByCategory(context.relevantFacts);

    return {
      knownPreferences: grouped.preferences.map((f) => f.content),
      knownConstraints: grouped.constraints.map((f) => f.content),
      recentDecisions: grouped.decisions.slice(0, 5).map((f) => f.content),
      errorPatterns: grouped.errors.slice(0, 3).map((f) => f.content),
    };
  }

  /**
   * Determine if sufficient context exists to provide good guidance
   */
  hasEnoughContext(context: MemoryContext | null): boolean {
    if (!context) return false;

    const grouped = this.groupFactsByCategory(context.relevantFacts);
    const hasDecisions = grouped.decisions.length > 0;
    const hasPreferences = grouped.preferences.length > 0;
    const hasConstraints = grouped.constraints.length > 0;

    // Consider it sufficient if we have at least 2 category types
    const categoryCount = [hasDecisions, hasPreferences, hasConstraints].filter((x) => x).length;

    return categoryCount >= 2 && context.relevantFacts.length >= 3;
  }

  /**
   * Create a memory-augmented system prompt
   */
  createAugmentedSystemPrompt(
    basePrompt: string,
    context: MemoryContext | null,
    hasMemory: boolean = true,
  ): string {
    if (!hasMemory || !context) return basePrompt;

    const profile = this.buildUserProfile(context);

    if (!profile.knownPreferences.length && !profile.knownConstraints.length) {
      return basePrompt;
    }

    const augmentations: string[] = [];

    if (profile.knownPreferences.length > 0) {
      augmentations.push(`This user's known preferences: ${profile.knownPreferences.join("; ")}`);
    }

    if (profile.knownConstraints.length > 0) {
      augmentations.push(`Required constraints: ${profile.knownConstraints.join("; ")}`);
    }

    if (profile.recentDecisions.length > 0) {
      augmentations.push(
        `Recent strategic decisions: ${profile.recentDecisions.slice(0, 2).join("; ")}`,
      );
    }

    const contextAddendum = `

[Memory Context] ${augmentations.join(" ") || "Building context from conversation history."}`;

    return basePrompt + contextAddendum;
  }
}

let builderInstance: MemoryContextBuilder | null = null;

export function getContextBuilder(): MemoryContextBuilder {
  if (!builderInstance) {
    builderInstance = new MemoryContextBuilder();
  }
  return builderInstance;
}

export { MemoryContextBuilder };
