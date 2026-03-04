# CouncilClaw Memory System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          User Query Submitted                            │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Memory Context Retrieval                            │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 1. Query Memory Store for user facts                             │  │
│  │ 2. Filter by confidence (≥0.5)                                   │  │
│  │ 3. Sort by relevance & recency                                   │  │
│  │ 4. Build context object                                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
        ┌──────────────────┐  ┌──────────────────┐
        │ First Opinions   │  │ Complexity Check │
        │ (Council Members)│  │                  │
        └────────┬─────────┘  └──────────────────┘
                 │
      ┌──────────▼──────────┐
      │ Inject Memory into  │
      │ Model Prompts       │
      │ (Context String)    │
      └──────────┬──────────┘
                 │
          ┌──────▼──────┐
          │ Models read │
          │ context and │
          │ provide     │
          │ informed    │
          │ opinions    │
          └──────┬──────┘
                 │
     ┌───────────▼───────────┐
     │ Blind Review & Dissent│
     │ Detection             │
     └───────────┬───────────┘
                 │
        ┌────────▼────────┐
        │ Chairman        │
        │ Refinement      │
        │ (with memory)   │
        └────────┬────────┘
                 │
             ▼
      ┌──────────────────┐
      │ Execute Plan     │
      └──────────┬───────┘
                 │
         ┌───────▼────────┐
         │ Record Decision│
         │ Extract Facts  │
         │ Store in Memory│
         │ Update Traces  │
         └────────────────┘
```

## Memory Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                    CouncilClaw Council Engine                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ Memory Orchestrator  │
                    │  (Main Coordinator)  │
                    └──────────┬───────────┘
                               │
            ┌──────────┬───────┼────────┬──────────┐
            ▼          ▼       ▼        ▼          ▼
      ┌─────────┐ ┌────────┐┌──────┐┌────────┐┌──────────┐
      │ Memory  │ │ Fact   ││Memory││Session ││ Context  │
      │ Store   │ │Extract ││Store ││Manager ││ Builder  │
      │         │ │ortar   ││      ││        ││          │
      └────┬────┘ └───┬────┘└──────┘└────┬───┘└────┬─────┘
           │           │                  │         │
      Persist     Extract             Sessions   Build
      Facts       from                Manage   Context
      Messages    Council
                  Runs
```

## Data Flow: From Query to Enhanced Response

```
1. USER QUERY
   ↓
   "Can you design an authentication system?"

2. MEMORY RETRIEVAL
   ┌─────────────────────────────────────────────────┐
   │ Query Memory Store                              │
   │ - User: "alice-123"                             │
   │ - Categories: decisions, preferences            │
   │ - Confidence: >= 0.7                            │
   └─────────────────────────────────────────────────┘
   ↓ Returns:
   - Decision: "Use Express.js framework"
   - Decision: "PostgreSQL for auth tokens"
   - Preference: "JWT auth, not OAuth"
   - Constraint: "Single sign-on required"

3. CONTEXT INJECTION
   ┌─────────────────────────────────────────────────┐
   │ Original Prompt:                                 │
   │ "Design authentication for a web app"            │
   │                                                   │
   │ + Memory Context Injection:                      │
   │ "Past decisions: Use Express & PostgreSQL        │
   │  User prefers JWT, needs single sign-on"        │
   │                                                   │
   │ = Enhanced Prompt to models                      │
   └─────────────────────────────────────────────────┘
   ↓

4. COUNCIL DELIBERATION (with context)
   ┌─────────────────────────────────────────────────┐
   │ Council Members receive context:                 │
   │ - All proposals align with Express & JWT        │
   │ - Suggestions respect single-sign-on            │
   │ - Avoid OAuth (known user preference against)   │
   │ - Leverage PostgreSQL knowledge                 │
   └─────────────────────────────────────────────────┘
   ↓ Better informed responses!

5. MEMORY RECORDING
   ┌─────────────────────────────────────────────────┐
   │ Extract new facts:                               │
   │ - Decision: "Use JWT with refresh tokens"       │
   │ - Constraint: "30-day token expiry"             │
   │ - Error: "Don't forget password reset flow"     │
   └─────────────────────────────────────────────────┘
   ↓ Stored in memory

6. NEXT QUERY
   ┌─────────────────────────────────────────────────┐
   │ "How should we handle password resets?"         │
   │                                                  │
   │ Memory already knows:                           │
   │ - Using Express & JWT auth                      │
   │ - PostgreSQL database                           │
   │ - Single sign-on requirement                    │
   │ - Common error: Don't forget reset flow (!)    │
   │                                                  │
   │ → Hyper-targeted recommendations!              │
   └─────────────────────────────────────────────────┘
```

## Memory Storage Structure

```
~/.config/councilclaw/memory/
│
├── facts_alice-123.json
│   └── Array of MemoryFact objects
│       ├── id: "uuid-123"
│       ├── userId: "alice-123"
│       ├── content: "Use Express.js"
│       ├── category: "preference"
│       ├── confidence: 0.85
│       ├── tags: ["framework", "backend"]
│       └── ...more facts...
│
├── messages_session-uuid-456.json
│   └── Array of ConversationMessage objects
│       ├── id: "msg-uuid-1"
│       ├── role: "user"
│       ├── content: "Design auth system"
│       ├── createdAt: "2026-03-04T10:30:00Z"
│       └── ...more messages...
│
└── session_session-uuid-456.json
    └── UserSession object
        ├── id: "session-uuid-456"
        ├── userId: "alice-123"
        ├── channel: "cli"
        ├── startedAt: "2026-03-04T10:00:00Z"
        ├── lastActivityAt: "2026-03-04T10:35:00Z"
        └── messageCount: 15
```

## Memory Categories & Confidence Scoring

```
┌──────────────────────────────────────────────────────┐
│                 MEMORY CATEGORIES                     │
├──────────────────────────────────────────────────────┤
│                                                       │
│ 1. DECISIONS (Confidence: 0.80-0.90)                │
│    "We chose PostgreSQL for the database"           │
│    → Used to align future recommendations           │
│                                                       │
│ 2. PREFERENCES (Confidence: 0.70-0.85)              │
│    "I prefer TypeScript for type safety"            │
│    → Guide model suggestions                        │
│                                                       │
│ 3. CONSTRAINTS (Confidence: 0.75-0.90)              │
│    "Must run on Linux with 2GB RAM"                 │
│    → Hard requirements for solutions                │
│                                                       │
│ 4. LEARNINGS (Confidence: 0.50-0.75)                │
│    "Council disagreed on: REST vs GraphQL"          │
│    → Alternative perspectives from dissent          │
│                                                       │
│ 5. ERRORS (Confidence: 0.70-0.85)                   │
│    "Race conditions with concurrent updates"        │
│    → Patterns to avoid in future                    │
│                                                       │
│ 6. CONTEXT (Confidence: 0.60-0.80)                  │
│    "User mentioned company size is 50 people"       │
│    → Background context                            │
│                                                       │
└──────────────────────────────────────────────────────┘

Confidence Calculation:
  - Explicit statement: +0.85 base
  - Multiple model agreement: +0.1 per model
  - From council dissent: -0.15
  - Entity extraction: +0.05 per occurrence
  - Result: Clamped to [0, 1]
```

## Session Lifecycle

```
Session Creation
    ↓
    ├─ User starts chat
    ├─ Session ID: uuid
    ├─ User ID: username
    ├─ Channel: "cli"
    │
    ▼
Message Tracking
    ├─ User: "Design API"
    ├─ Council: "Here's recommendation..."
    ├─ User: "How about auth?"
    ├─ Council: "Considering your preferences..."
    │
    ▼
Session Activity
    ├─ Last active: just-now
    ├─ Message count: 15
    ├─ Duration: 25 minutes
    │
    ▼
Fact Extraction
    ├─ Extract decisions
    ├─ Extract preferences
    ├─ Extract constraints
    ├─ Score confidence
    │
    ▼
Memory Recording
    ├─ Save in user facts file
    ├─ Tag for future retrieval
    ├─ Index by category
    │
    ▼
Session Close/Archive
    ├─ Mark as archived
    ├─ Keep history accessible
    ├─ Use in context for future sessions
```

## Integration Points

```
┌──────────────────────────────────────┐
│     Council Engine (runCouncil)      │
│                                      │
│ Calls orchestrator:                  │
│ - recordCouncilRun(task, result)    │
│ - enrichPrompt(basePrompt, userId)   │
└──────────────────────────────────────┘
         │                    │
         │                    │
         ▼                    ▼
    ┌──────────────┐   ┌──────────────────┐
    │ Memory Store │   │ Context Builder  │
    │              │   │                  │
    │ Saves facts  │   │ Injects context  │
    │ Messages     │   │ into prompts     │
    └──────────────┘   └──────────────────┘


┌──────────────────────────────────────┐
│  LLM Provider (openrouter-client)    │
│                                      │
│ Receives memory context:             │
│ - askModel() with context            │
│ - chairmanRefine() with context      │
└──────────────────────────────────────┘


┌──────────────────────────────────────┐
│    CLI / Server Initialization       │
│                                      │
│ Calls:                               │
│ - initializeMemoryStore()            │
│ - getMemoryOrchestrator()           │
└──────────────────────────────────────┘
```

## Performance Characteristics

```
Operation          Time        Notes
─────────────────────────────────────────
Initialize         <100ms      One-time on startup
Query facts        <10ms       Cached in memory
Store fact         <5ms        File write async
Build context      <20ms       Aggregates data
Enrich prompt      <30ms       With context injection
Extract from run   <50ms       Pattern matching
Session create     <5ms        In-memory

Memory per user:
- 1000 facts      ≈ 500KB
- 500 messages    ≈ 1MB
- Total/user      ≈ 1.5MB

Typical memory usage:
- 10 users        ≈ 15MB
- 100 users       ≈ 150MB
- 1000 users      ≈ 1.5GB
```

## Error Handling & Fallbacks

```
Memory Startup Failure
    ↓
    Try: Initialize memory store
    Catch: Log warning
    Continue: Run without memory
    Result: Full functionality without learned context

Memory Recording Failure
    ↓
    Try: Extract and record facts
    Catch: Log error, don't throw
    Continue: Return council result normally
    Result: Current query unaffected, facts not saved

Memory Retrieval Failure
    ↓
    Try: Query facts
    Catch: Return empty context
    Continue: Council runs with no context
    Result: Falls back to generic recommendations

Strategy: Graceful degradation - memory failures
         never break core council functionality
```

---

This architecture ensures memory enhancement happens transparently, improving results over time while maintaining system reliability and performance.
