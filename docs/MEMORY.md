# CouncilClaw Memory System

CouncilClaw now includes an intelligent memory system that enhances user experience and agent capabilities by learning from past decisions, preferences, and interactions. This document explains the memory system and how to leverage it.

## Overview

The memory system automatically:
- **Records conversations** - Maintains conversation history for persistent context
- **Extracts facts** - Intelligently extracts decisions, preferences, constraints, and learnings
- **Builds context** - Creates memory-augmented prompts that reflect user patterns
- **Manages sessions** - Tracks user sessions and conversation continuity
- **Improves decisions** - Council members make better-informed decisions based on past context

## Memory Components

### 1. **Memory Store** (`src/memory/store.ts`)
The core persistence layer that manages data storage and retrieval.

**Features:**
- Persistent JSON-based storage in `~/.config/councilclaw/memory/`
- Efficient caching for fast retrieval
- Automatic cleanup of old conversations (90-day default retention)
- Configurable limits on facts and messages per user

**Data stored:**
- `MemoryFact` - Extracted facts with confidence scores
- `ConversationMessage` - Talk history with metadata
- `UserSession` - Session information and activity tracking

### 2. **Fact Extractor** (`src/memory/extractor.ts`)
Automatically identifies and extracts important information from interactions.

**Extraction categories:**
- **Decisions** - Strategies the user chose and what was decided
- **Preferences** - How the user likes to work or be communicated with
- **Constraints** - Limitations, requirements, or boundaries
- **Learnings** - Alternative perspectives from council dissent
- **Errors** - Common error patterns for avoidance in future

**Smart extraction:**
- Pattern matching for natural language extraction
- Confidence scoring (0-1) indicating reliability
- Automatic tagging for easy retrieval
- Context-aware weighting

### 3. **Context Builder** (`src/memory/context.ts`)
Turns stored memories into actionable context for council members.

**Capabilities:**
- Builds memory-augmented prompts for models
- Creates role-specific context (different for chairman vs reviewers)
- Groups facts by category for presentation
- Detects when sufficient context exists for meaningful guidance
- Generates user profiles from memory

### 4. **Session Manager** (`src/memory/session.ts`)
Manages conversation continuity within a session or user.

**Features:**
- Creates and tracks sessions per user/channel combination
- Maintains conversation threads
- Allows session reuse for multi-turn conversations
- Provides session activity statistics
- Supports graceful session closure

## How It Works

### During a Council Run

1. **Memory Retrieval**: When a user submits a query, the system retrieves relevant past facts and conversation history

2. **Context Injection**: Memory context is automatically injected into model prompts:
   ```
   [Memory-Augmented Context]
   # Recent Context
   [Previous conversation summary]
   
   # Previous Decisions
   - Decision: User prefers modular architectures
   - Decision: Team uses TypeScript exclusively
   
   # Known Constraints
   - Constraint: Budget limited to 2 engineers
   - Constraint: Must be compatible with Node 20+
   
   # User Preferences
   - Preference: Wants performant solutions
   - Preference: Values security-first approaches
   ```

3. **Enhanced Deliberation**: Council members receive this context and make better-informed proposals that:
   - Align with past decisions
   - Respect stated constraints
   - Honor user preferences
   - Avoid known problematic patterns

4. **Fact Recording**: After the council run:
   - Decisions are extracted and stored with confidence scores
   - Constraints mentioned are recorded
   - Alternative perspectives (dissent) are learned
   - Any errors encountered are logged for future avoidance

5. **Continuous Learning**: Future queries automatically benefit from accumulated knowledge

## Memory Storage Structure

```
~/.config/councilclaw/memory/
├── facts_<user-id>.json           # All extracted facts for a user
├── messages_<session-id>.json      # Message history per session
└── session_<session-id>.json       # Session metadata
```

**Example fact:**
```json
{
  "id": "uuid",
  "userId": "user-123",
  "content": "Decision: Prefer TypeScript for type safety",
  "category": "preference",
  "confidence": 0.85,
  "source": "extraction",
  "extractedFrom": "task-id-456",
  "createdAt": "2026-03-04T10:30:00Z",
  "updatedAt": "2026-03-04T10:30:00Z",
  "tags": ["languages", "user-preference"]
}
```

## Memory Capabilities vs OpenClaw

| Feature | CouncilClaw | OpenClaw |
|---------|-------------|----------|
| Conversation History | ✅ Yes | ✅ Yes |
| Fact Extraction | ✅ Automatic | ✅ Automatic |
| Context Injection | ✅ Per-model | ✅ Per-model |
| Confidence Scoring | ✅ Yes | ✅ Yes |
| Session Management | ✅ Yes | ✅ Yes |
| Dissent Learning | ✅ Yes | ✅ Possible |
| Multi-turn Conversations | ✅ Yes | ✅ Yes |
| User Profiles | ✅ Yes | ✅ Yes |
| Automatic Cleanup | ✅ Yes | Varies |

**CouncilClaw Advantages:**
- Multi-council deliberation with memory awareness
- Dissent-based learning (from blind review alternatives)
- Confidence-weighted fact prioritization
- Role-aware context (different for chairman, reviewers, council)
- Automatic fact extraction without manual input

## Configuration

### Memory Store Options

Configure memory behavior via `MemoryStoreConfig`:

```typescript
{
  storePath: string;                    // Default: ~/.config/councilclaw/memory
  maxFactsPerUser: number;              // Default: 1000
  maxMessagesPerSession: number;        // Default: 500
  conversationRetentionDays: number;    // Default: 90
  autoCleanupEnabled: boolean;          // Default: true
}
```

### Environment Variables

- `MEMORY_STORE_PATH` - Override default memory storage location
- `MEMORY_RETENTION_DAYS` - Override conversation retention period

## API Usage

### Recording a Council Run

```typescript
import { getMemoryOrchestrator } from "./memory/index.js";

const orchestrator = getMemoryOrchestrator();
await orchestrator.recordCouncilRun(task, result);
```

### Getting Memory Context

```typescript
// Get full memory context for a user
const context = await orchestrator.getMemoryContext(userId, sessionId);

// Get context as text for prompt injection
const injection = await orchestrator.getContextInjection(userId, sessionId);

// Enrich a prompt with memory context
const enrichedPrompt = await orchestrator.enrichPrompt(basePrompt, userId);
```

### Building User Profiles

```typescript
const profile = await orchestrator.getUserProfile(userId);
// Returns: { knownPreferences, knownConstraints, recentDecisions, errorPatterns }
```

### Session Management

```typescript
import { getSessionManager } from "./memory/index.js";

const manager = getSessionManager();

// Create a new session
const session = await manager.initializeSession({
  userId: "user-123",
  channel: "cli",
  reuseExistingSession: true
});

// Add messages to session
await manager.addMessageToSession(
  session.id,
  "user",
  "Can you help me with...",
  { source: "cli" }
);

// Get conversation history
const history = await manager.getSessionHistory(session.id, 20);

// Get session statistics
const stats = await manager.getSessionStats(session.id);
```

## Best Practices

### 1. **Explicit Constraints** 
Be explicit about constraints and requirements - the system learns from them:
```
"Can you design a system that runs on Docker, handles 10K req/s, 
and costs less than $500/month?"
```

### 2. **Preference Statements**
Express preferences clearly for better alignment:
```
"I prefer Rust for performance-critical code" 
"We always use PostgreSQL, not MongoDB"
```

### 3. **Session Continuity**
Keep related queries in the same session for better context:
```
Query 1: "Design a caching layer"
Query 2: "How should we monitor its performance?"  # Understands the caching context
```

### 4. **Review Dissent**
Pay attention to dissent/alternative views - they're recorded as learnings:
```
💭 Dissent: Some council members preferred a different approach...
```

### 5. **Regular Decisions**
Document significant decisions explicitly - this trains future responses:
```
"We've decided on React for the frontend"
"Going forward, all APIs should use OpenAPI specs"
```

## Troubleshooting

### Memory Not Being Used

1. **Check initialization**: Memory system initializes on first run
2. **Verify storage**: Check `~/.config/councilclaw/memory/` directory exists
3. **Enable debug logging**: Set `DEBUG=councilclaw:*` to see memory operations

### Too Much Memory Being Stored

1. Adjust `maxFactsPerUser` (default: 1000)
2. Adjust `conversationRetentionDays` (default: 90)
3. Enable `autoCleanupEnabled` for automatic monthly cleanup

### Memory Context Not in Prompts

1. First interaction will have minimal context
2. Context injection requires at least 3 facts of 2+ categories to be meaningful
3. Only facts with confidence >= 0.5 are included by default

## Monitoring

### Check Memory Statistics

```typescript
const stats = await orchestrator.getStats();
// Returns: { totalFacts, totalSessions, totalMessages }
```

### View User Profile

```typescript
const profile = await orchestrator.getUserProfile(userId);
console.log(profile);
// {
//   knownPreferences: [...],
//   knownConstraints: [...],
//   recentDecisions: [...],
//   errorPatterns: [...]
// }
```

## Privacy & Data

- **User-scoped**: All memory is isolated per `userId`
- **Local storage**: All facts stored locally in `~/.config/councilclaw/`
- **No external transmission**: Memory never leaves your machine
- **Retention**: Conversations auto-delete after 90 days (configurable)
- **GDPR-friendly**: Supports complete user data deletion by removing user files

## Future Enhancements

Potential improvements to the memory system:
- **Vector embeddings** - Semantic similarity search for facts
- **Memory graphs** - Track relationships between decisions
- **Multi-user learning** - Shared organizational memory (opt-in)
- **Memory compression** - Summarize old conversations
- **Export/Import** - Backup and transfer memory between systems
- **Privacy controls** - Granular permissions for different fact types

## Integration Points

The memory system integrates with:

1. **Council Engine** - Records runs and extracts facts
2. **LLM Provider** - Injects context into model prompts
3. **CLI** - Initializes memory on startup
4. **Session Manager** - Tracks conversations per user
5. **Fact Extractor** - Learns from council decisions
6. **Context Builder** - Creates actionable prompts

---

**Questions?** See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details or [API.md](./API.md) for integration examples.
