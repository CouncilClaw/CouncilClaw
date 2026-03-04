/**
 * Memory System Usage Examples
 * 
 * This file demonstrates how to use CouncilClaw's memory system to enhance
 * user experience and agent decision-making.
 */

// ============================================================================
// Example 1: Basic Memory Initialization and Usage
// ============================================================================

import {
  initializeMemoryStore,
  getMemoryOrchestrator,
  getSessionManager,
} from "./src/memory/index.js";

async function exampleBasicUsage() {
  // Initialize the memory system (typically done in main())
  await initializeMemoryStore();

  const orchestrator = getMemoryOrchestrator();
  const sessionManager = getSessionManager();

  // ... memory is now ready to use throughout your application
}

// ============================================================================
// Example 2: Creating and Managing Sessions
// ============================================================================

async function exampleSessionManagement() {
  const sessionManager = getSessionManager();

  // Create a new session for a user
  const session = await sessionManager.initializeSession({
    userId: "user-john-doe",
    channel: "cli",
    reuseExistingSession: true, // Reuse if one exists
  });

  console.log("Session created:", session.id);

  // Add user message to session
  await sessionManager.addMessageToSession(
    session.id,
    "user",
    "Can you design a microservices architecture?"
  );

  // Add council response to session
  await sessionManager.addMessageToSession(
    session.id,
    "council",
    "Here's a recommended decomposition: [...]"
  );

  // Get conversation history
  const history = await sessionManager.getSessionHistory(session.id, 10);
  console.log("Last 10 messages:", history);

  // Get session statistics
  const stats = await sessionManager.getSessionStats(session.id);
  console.log("Session duration:", stats?.durationMs, "ms");
  console.log("Total messages:", stats?.messageCount);
}

// ============================================================================
// Example 3: Recording Council Decisions in Memory
// ============================================================================

async function exampleRecordingDecisions() {
  const orchestrator = getMemoryOrchestrator();

  // After running a council deliberation, the orchestrator automatically
  // records the decision and extracts facts. This happens in runCouncil(),
  // but here's how you might do it directly:

  // const result = await runCouncil(task);
  // await orchestrator.recordCouncilRun(task, result);

  // This automatically:
  // 1. Extracts decisions from council rationale
  // 2. Identifies constraints mentioned in the task
  // 3. Records dissent as alternative perspectives
  // 4. Stores error patterns for future avoidance
}

// ============================================================================
// Example 4: Retrieving Memory Context for Decisions
// ============================================================================

async function exampleRetrievingContext() {
  const orchestrator = getMemoryOrchestrator();

  const userId = "user-john-doe";

  // Get full memory context object
  const context = await orchestrator.getMemoryContext(userId);

  if (context) {
    console.log("Known preferences:", context.userPreferences);
    console.log("Recent decisions:", context.recentConversations);
    console.log("Relevant facts:", context.relevantFacts);
    console.log("Session summary:", context.sessionSummary);
  }

  // Get context as a string ready for injection into prompts
  const contextString = await orchestrator.getContextInjection(userId);
  console.log("Context to inject into prompts:\n", contextString);
}

// ============================================================================
// Example 5: Building User Profiles
// ============================================================================

async function exampleUserProfiles() {
  const orchestrator = getMemoryOrchestrator();

  const userId = "user-john-doe";

  // Get a comprehensive profile of what the system knows about a user
  const profile = await orchestrator.getUserProfile(userId);

  if (profile) {
    console.log("Known preferences:", profile.knownPreferences);
    // Output: ["Prefers TypeScript", "Uses Docker", "Git workflow"]

    console.log("Known constraints:", profile.knownConstraints);
    // Output: ["Budget $5K/month", "Must run on-prem", "Team of 3 engineers"]

    console.log("Recent decisions:", profile.recentDecisions);
    // Output: ["Chose PostgreSQL over MongoDB", "Decided on React frontend"]

    console.log("Error patterns:", profile.errorPatterns);
    // Output: ["Connection timeouts on large queries", "Race conditions with concurrent workers"]
  }
}

// ============================================================================
// Example 6: Memory-Augmented Prompts
// ============================================================================

async function exampleMemoryAugmentedPrompts() {
  const orchestrator = getMemoryOrchestrator();

  const userId = "user-john-doe";
  const basePrompt = "Design a caching strategy for this system.";

  // Enrich a base prompt with user's memory context
  const enrichedPrompt = await orchestrator.enrichPrompt(
    basePrompt,
    userId
  );

  console.log("Original prompt:", basePrompt);
  console.log("\nEnriched prompt with memory:", enrichedPrompt);
  // The enriched prompt now includes user's known preferences, constraints,
  // and past decisions, helping the council make better-informed proposals
}

// ============================================================================
// Example 7: Monitoring Memory Usage
// ============================================================================

async function exampleMonitoringMemory() {
  const orchestrator = getMemoryOrchestrator();

  // Get statistics about what's stored in memory
  const stats = await orchestrator.getStats();

  if (stats) {
    console.log("Total facts stored:", stats.totalFacts);
    console.log("Active sessions:", stats.totalSessions);
    console.log("Total messages:", stats.totalMessages);
  }

  // This helps monitor:
  // - How much the system is learning
  // - Storage usage growth
  // - Whether memory cleanup is working as expected
}

// ============================================================================
// Example 8: Complete CLI Chat Flow with Memory
// ============================================================================

async function exampleChatFlowWithMemory() {
  const orchestrator = getMemoryOrchestrator();
  const sessionManager = getSessionManager();
  const userId = "cli-user";

  // 1. Initialize session for this chat session
  const session = await sessionManager.initializeSession({
    userId,
    channel: "cli",
    reuseExistingSession: true,
  });

  // 2. User enters a query
  const userQuery = "Can you help design a system?";

  // 3. Add user message to session
  await sessionManager.addMessageToSession(session.id, "user", userQuery);

  // 4. System retrieves memory context (automatic in council engine)
  const memoryContext = await orchestrator.getMemoryContext(
    userId,
    session.id
  );

  // 5. Council uses memory to make better decisions (automatic in runCouncil)
  // const result = await runCouncil({ userId, text: userQuery, ... });

  // 6. Add council response to session
  // await sessionManager.addMessageToSession(
  //   session.id,
  //   "council",
  //   result.chairmanPlan.rationale
  // );

  // 7. Facts are extracted and stored automatically

  // 8. Next query in same session already has context from all previous messages!
}

// ============================================================================
// Example 9: Fact Extraction Demonstration
// ============================================================================

async function exampleFactExtraction() {
  // In practice, facts are extracted automatically after council runs.
  // Here's what gets extracted from different inputs:

  const exampleInputs = {
    decision: "We decided to use PostgreSQL for the database",
    // Extracted: Decision: "Use PostgreSQL for database"

    preference: "I prefer TypeScript for type safety",
    // Extracted: Preference: "Use TypeScript"

    constraint: "Must run on Linux with 2GB RAM",
    // Extracted: Constraint: "2GB RAM requirement"

    errorPattern: "We sometimes get race conditions with concurrent updates",
    // Extracted: Error: "Race conditions with concurrent updates"
  };

  // Extractions are scored 0-1 on confidence:
  // - 0.85+: High reliability (explicit statements)
  // - 0.5-0.8: Medium confidence (inferred from context)
  // - <0.5: Lower confidence (uncertain patterns)
}

// ============================================================================
// Real-World Scenario: Progressive Learning
// ============================================================================

async function realWorldScenario() {
  const orchestrator = getMemoryOrchestrator();
  const sessionManager = getSessionManager();
  const userId = "alice-engineer";

  // Day 1: Alice starts using CouncilClaw
  const session1 = await sessionManager.initializeSession({
    userId,
    channel: "cli",
  });

  console.log("Day 1: First session started");
  console.log("Memory: Empty (no prior context)");

  // Query 1: "Design a REST API"
  // Council makes generic suggestions
  // Memory records: Decision to use REST, Alice mentions she prefers Express

  // Day 2: Alice returns
  const session2 = await sessionManager.initializeSession({
    userId,
    channel: "cli",
    reuseExistingSession: true,
  });

  console.log("\nDay 2: New session started (could be same channel)");

  // Get what the system learned
  const profile = await orchestrator.getUserProfile(userId);
  console.log(
    "Memory now knows:",
    profile?.knownPreferences
  );
  // "Use Express", "Prefer REST over GraphQL"

  // Query 2: "How should we handle authentication?"
  // Council is smarter: knows Alice uses Express, suggests Express middleware
  // Memory records: Decision to use JWT tokens, constraint: single-sign-on

  // Day 3+: Memory continues growing
  // - Each decision is recorded
  // - Each constraint is learned
  // - Each error is noted for avoidance
  // - Council becomes increasingly tailored to Alice's patterns

  console.log("\nDay 3+: Cumulative wisdom");
  console.log("Memory knows Alice's:");
  console.log("- Preferred technologies (Express, PostgreSQL, JWT)");
  console.log("- Known constraints (single-sign-on, 99.9% uptime)");
  console.log("- Past decisions (REST, microservices, Docker)");
  console.log("- Common errors (auth token expiry issues)");
  console.log(
    "\nCouncil now makes increasingly personalized and accurate recommendations!"
  );
}

// ============================================================================
// Export for demonstration
// ============================================================================

export {
  exampleBasicUsage,
  exampleSessionManagement,
  exampleRecordingDecisions,
  exampleRetrievingContext,
  exampleUserProfiles,
  exampleMemoryAugmentedPrompts,
  exampleMonitoringMemory,
  exampleChatFlowWithMemory,
  exampleFactExtraction,
  realWorldScenario,
};
