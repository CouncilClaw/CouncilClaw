# CouncilClaw Architecture

## Pipeline
1. Ingress (CLI/API)
2. Complexity routing
3. Task decomposition
4. First opinions (multi-model)
5. Blind review + dissent detection
6. Chairman synthesis/refinement
7. Guarded execution
8. Trace persistence

## Core modules
- `src/council/*`: deliberation and synthesis
- `src/llm/*`: provider and model selection
- `src/execution/*`: command policy and execution
- `src/router/*`: complexity + task type routing
- `src/telemetry/*`: traces and persistence
- `src/cli/*`: chat and configure UX
- `src/api/*`: webhook server
