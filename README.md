# CouncilClaw

![CouncilClaw Banner](assets/branding/councilclaw-banner.jpg)

**CouncilClaw: Multi-model deliberation, single-agent execution.**

CouncilClaw combines NanoClaw-style agent execution with LLM-council-style anonymous deliberation:
- **Simple tasks**: route to direct execution path.
- **Complex tasks**: run through first opinions → blind rotated review → chairman synthesis.
- **Execution**: run approved plan chunks and return output + council trace.

## Current Status (v0.1)
Implemented:
- TypeScript project bootstrap
- Core data contracts/interfaces
- Complexity router heuristic
- Task decomposer
- Council anonymizer
- Blind-review scoring stage (MVP heuristic)
- Chairman weighted synthesis logic
- OpenRouter-ready LLM provider (auto-fallback to stub if key missing)
- Execution stub
- Trace builder

## Project Layout
```text
src/
  api/
  council/
    anonymizer.ts
    chairman.ts
    council-engine.ts
    reviewer.ts
  execution/
    executor.ts
  llm/
    model-registry.ts
    openrouter-client.ts
    provider.ts
  planning/
    decomposer.ts
  router/
    complexity-router.ts
  telemetry/
    trace.ts
  types/
    contracts.ts
  index.ts
assets/
  branding/
    councilclaw-banner.jpg
```

## Quick Start
```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Environment
```bash
OPENROUTER_API_KEY=
# Optional
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
COUNCIL_MODELS=openai/gpt-4.1-mini,google/gemini-2.5-flash,anthropic/claude-3.5-sonnet
CHAIRMAN_MODEL=openai/gpt-4.1
```
