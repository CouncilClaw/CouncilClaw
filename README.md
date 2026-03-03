# CouncilClaw

![CouncilClaw Banner](assets/branding/councilclaw-banner.jpg)

**CouncilClaw: Multi-model deliberation, single-agent execution.**

CouncilClaw combines NanoClaw-style agent execution with LLM-council-style anonymous deliberation:
- **Simple tasks**: route to direct execution path.
- **Complex tasks**: run through first opinions → blind rotated review → chairman synthesis.
- **Execution**: run approved plan chunks and return output + council trace.

## Current Status (v0.1 skeleton)
Implemented:
- TypeScript project bootstrap
- Core data contracts/interfaces
- Complexity router heuristic
- Task decomposer
- Council anonymizer
- Blind-review placeholder stage
- Chairman synthesis placeholder
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

## Development Log
- 2026-03-03: Bootstrapped TypeScript repository and pushed `main` to GitHub.
- 2026-03-03: Added v0.1 architecture skeleton + branding image + updated README process log.

## Next Steps
1. Replace `StubLlmProvider` with OpenRouter client.
2. Implement real chunking and dependency graph.
3. Add weighted scoring and dissent detection in blind review.
4. Integrate NanoClaw channel ingress + sandbox executor.
