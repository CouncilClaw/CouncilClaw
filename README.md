# CouncilClaw

![CouncilClaw Banner](assets/branding/councilclaw-banner.jpg)

**CouncilClaw: Multi-model deliberation, single-agent execution.**

## Quick Start
```bash
npm install
npm run build
npm run cli -- config init
npm run cli -- models
npm run cli -- chat
```

## CLI
```bash
# Start interactive chat
npm run cli -- chat

# Show supported models
npm run cli -- models

# Config management
npm run cli -- config init
npm run cli -- config show
npm run cli -- config set openrouter_api_key <KEY>
npm run cli -- config set chairman_model openai/gpt-4.1
npm run cli -- config set council_models openai/gpt-4.1-mini,google/gemini-2.5-flash
```

Config file path:
- `~/.config/councilclaw/config.json`
- override with `COUNCILCLAW_CONFIG_PATH`

## OpenClaw-style Configuration Simplicity
CouncilClaw now uses a central config file and command-based setup, so users do not need to edit source files to change models.

## Supported Models (built-in catalog)
- openai/gpt-4.1-mini
- openai/gpt-4.1
- google/gemini-2.5-flash
- google/gemini-2.5-pro
- anthropic/claude-3.5-sonnet
- anthropic/claude-3.7-sonnet
- x-ai/grok-4
- meta-llama/llama-3.3-70b-instruct

## Server/API
```bash
npm run dev:server
curl http://localhost:8787/health
```

## Chairman Model Authority
Users can request chairman model via payload option or inline text (`/chairman <model>`). Allowlist/fallback policy remains enforced.
