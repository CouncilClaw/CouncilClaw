# CouncilClaw

![CouncilClaw Banner](assets/branding/councilclaw-banner.jpg)

**CouncilClaw: Multi-model deliberation, single-agent execution.**

An intelligent LLM-powered system that combines multiple model perspectives for better decision-making. CouncilClaw uses deliberative processes—complexity routing, task decomposition, peer review, and synthesis—to deliver reliable results.

> ⚠️ **Experimental Build Notice**: CouncilClaw started as a vibe-coded prototype and is still evolving quickly. Validate outputs, review execution settings, and treat this release as fast-moving software—not a finalized enterprise platform.

## ⚡ Quickest Start (3 Commands)

```bash
# 1. Clone and install globally
git clone https://github.com/CouncilClaw/CouncilClaw.git && cd CouncilClaw
npm install && npm install -g .

# 2. Configure once
councilclaw setup

# 3. Start using
councilclaw chat
```

That's it! You're ready to go. No additional steps needed.

## ✨ Features

- **Multi-Model Consensus**: Harness opinions from multiple LLMs (OpenAI, Google, Anthropic, xAI, Meta)
- **Simple Task Routing**: Skip full council deliberation for simple tasks (like `mkdir` or `ls`), letting the Chairman handle them directly for speed and cost efficiency.
- **Complexity Routing**: Automatically route simple vs. complex tasks to appropriate deliberation pipelines
- **Task Decomposition**: Break complex requests into manageable, parallel-executable chunks
- **Blind Peer Review**: Anonymous model critiques detect flawed proposals before execution
- **Chairman Synthesis**: A designated model synthesizes diverse opinions into a coherent plan
- **Permissive Shell Execution**: Execute any shell command with safety guardrails that block dangerous patterns (like `rm -rf /`) and user-defined blocked commands.
- **Telemetry & Traces**: Comprehensive execution traces with timing metrics for every phase
- **CLI & Webhook API**: Interactive chat and programmatic task submission
- **Input Validation**: Zod-based schemas ensure data integrity across API boundaries
- **Structured Logging**: Debug-friendly logs with context and error tracking

## 🚀 Quick Command Reference

### Core Commands

```bash
councilclaw chat                     # Start interactive chat (easiest way to use it)
councilclaw setup                    # Configure: API key, models, channels (one time only)
councilclaw models                   # List available 33 models by provider
councilclaw config show              # View current configuration
councilclaw config set <key> <value> # Update a config value
councilclaw start                    # Run as service with webhook API + Telegram
```

### Alternative (from project directory, without global install):

```bash
npm run chat                         # Start interactive chat
npm run setup                        # Interactive wizard
npm run models                       # List models
npm run cli -- config show           # View config
npm run cli -- config set <key> <val> # Update config
npm start                            # Run as service
```

## 📋 First-Time Setup

Run this **once** to configure everything:

```bash
councilclaw setup
```

You'll be guided through:
1. ✓ **Risk acknowledgment** - Review security considerations
2. ✓ **API Configuration** - Set OpenRouter API key (get free $5 at [openrouter.ai](https://openrouter.ai))
3. ✓ **Model Selection** - Choose 1-8 models (hierarchical picker: Provider → Version)
4. ✓ **Channel Setup** - Optional: Telegram, Slack, Discord, etc.
5. ✓ **System Settings** - Port, blocklist, commands

**Interactive Menu Features:**
- Keyboard: `↑/↓` to move, `Space` to select, `Enter` to confirm
- Hierarchical model selection by provider
- Automatic chairman model derivation from your council

## 🧠 How It Works

When you run `councilclaw chat`, CouncilClaw deliberates:

```
[INFO] Simple task detected - skipping council opinions
📋 openai/gpt-4.1:
   Creating the folder 'new-project'...
   Done.

⏱️  450ms (decomp: 20ms | first: 0ms | review: 0ms | synthesis: 430ms)
```

**For simple tasks**: Skips multi-model deliberation and goes straight to execution (fast ⚡)
**For complex tasks**: Runs full council with multi-model opinions, peer review, and synthesis

**Output contains:**
- **📋 Model Name**: The chairman model that created the plan
- **⏱️ Timing**: Breakdown of each phase (decomposition, first opinions, reviews, synthesis)
- **💭 Dissent**: Minority opinions (complex tasks only)
- **⚠️ Errors**: Clear error messages if something fails

## 🔌 Using CouncilClaw

### Interactive Chat

```bash
councilclaw chat
```

Then just type your questions:
```
you> What is 2+2?
you> Design a REST API for user authentication
you> exit  # or Ctrl+C for graceful exit
```

### As a Service (Webhook API)

Run as an always-on service:

```bash
export OPENROUTER_API_KEY="your-api-key"
councilclaw start
```

Submit tasks via HTTP:
```bash
curl -X POST http://localhost:8787/task \
  -H "Content-Type: application/json" \
  -d '{"text":"Build a REST API"}'
```

### Enable at System Startup

So CouncilClaw starts automatically on reboot (no manual commands needed):

```bash
councilclaw install --daemon   # Creates systemd service
# Then follow the sudo commands displayed
```

To uninstall everything:
```bash
councilclaw uninstall          # Removes all data, config, and service
```

See full [startup guide](docs/STARTUP.md) for macOS (launchd) and manual setup.

### Telegram Bot

1. Configure during `councilclaw setup` → Channels → Telegram (paste bot token from @BotFather)
2. Run `councilclaw start`
3. Open Telegram, find your bot, send `/council your task`

Commands are registered automatically. Full guide: [Telegram setup](docs/CHANNEL_CONNECTION.md#telegram).

## 📋 Supported Models

CouncilClaw supports **33 models** across **9 providers**:

**OpenAI** (6) • **Google** (5) • **Anthropic** (4) • **xAI** (3) • **Meta** (6) • **Mistral** (3) • **Qwen** (3) • **Cohere** (2) • **Together** (1)

View all:
```bash
councilclaw models
```

**Model Selection Limits:**
- **Council Size**: Up to 8 models
- **Chairman Model**: Any single model from council (or override per request)
- **Recommendation**: Start with 2-3 models, add more only if needed for diversity

### By Provider

**OpenAI** (6 models)
- `openai/gpt-4.1-mini`, `openai/gpt-4.1`, `openai/gpt-4o`, `openai/gpt-4o-mini`, `openai/o1-mini`, `openai/o1`

**Google** (5 models)
- `google/gemini-2.5-flash`, `google/gemini-2.5-pro`, `google/gemini-2.0-flash`, `google/gemini-1.5-flash`, `google/gemini-1.5-pro`

**Anthropic** (4 models)
- `anthropic/claude-3.5-sonnet`, `anthropic/claude-3.7-sonnet`, `anthropic/claude-3-opus`, `anthropic/claude-3-haiku`

**xAI** (3 models)
- `x-ai/grok-4`, `x-ai/grok-3`, `x-ai/grok-2`

**Meta** (6 models)
- `meta-llama/llama-2-70b-chat`, `meta-llama/llama-3-8b-instruct`, `meta-llama/llama-3-70b-instruct`, `meta-llama/llama-3.1-8b-instruct`, `meta-llama/llama-3.1-70b-instruct`, `meta-llama/llama-3.3-70b-instruct`

**Mistral** (3 models)
- `mistralai/mistral-7b-instruct`, `mistralai/mistral-large`, `mistralai/mixtral-8x7b-instruct`

**Qwen** (3 models)
- `qwen/qwen-110b-chat`, `qwen/qwen-32b-chat`, `qwen/qwen-14b-chat`

**Cohere** (2 models)
- `cohere/command-r`, `cohere/command-r-plus`

**Together AI** (1 model)
- `togethercomputer/stripedhyena-nous-7b`

See full [Model Catalog](docs/ARCHITECTURE.md) for technical specifications.

## ⚙️ Configuration & Advanced Setup

### Manual Configuration

Configure CouncilClaw after setup:

```bash
# Set API key
councilclaw config set openrouter_api_key YOUR_API_KEY

# Set council models (1-8 models, comma-separated)
councilclaw config set council_models openai/gpt-4o-mini,google/gemini-2.0-flash,anthropic/claude-3.5-sonnet

# Set chairman model (must be from council)
councilclaw config set chairman_model openai/gpt-4o-mini

# View current configuration
councilclaw config show
```

### Configuration Limits

- **Council models**: Minimum 1, Maximum 8 (more models = more time & cost)
- **Chairman model**: Must be selected from your council
- **Recommended**: Start with 2-3 models and add more only if needed
- **Cost note**: Each additional model adds ~500-1000ms to complex task deliberation

### Configuration Files

```
~/.config/councilclaw/
├── config.json           # Your configuration (API keys, models, channels)
├── traces/               # Execution traces
│   └── *.jsonl          # Trace logs with timing metrics
└── memory/               # Memory system (if enabled)
    ├── facts_*.json
    ├── messages_*.json
    └── session_*.json
```

Override config path:
```bash
export COUNCILCLAW_CONFIG_PATH=/custom/path/config.json
```

### Environment Variables

Set these in your shell or `.env` file before running CouncilClaw:

```bash
# API (from OpenRouter)
export OPENROUTER_API_KEY="sk-or-xxx"
export OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
export OPENROUTER_MAX_RETRIES=2
export OPENROUTER_RETRY_BASE_MS=500

# Server
export PORT=8787
export COUNCILCLAW_MODE=demo  # or empty for service mode

# Security
export COUNCILCLAW_WEBHOOK_TOKEN="optional-bearer-token"
export BLOCKED_SHELL_COMMANDS="shutdown,reboot,format,mkfs"

# Debug
export DEBUG=true
```

## 🌐 Communication Channels

CouncilClaw supports **13 different channels** for integrating with your workflow.

**Quick Setup:**
- **Telegram**: Enabled during `councilclaw setup` (easiest - built-in bot)
- **Others** (Slack, Discord, Teams, etc.): See [Channel Connection Guide](docs/CHANNEL_CONNECTION.md)

**Supported channels:**
`slack` • `discord` • `teams` • `telegram` • `matrix` • `irc` • `email` • `whatsapp` • `cli` • `http` • `webhook` • `grpc` • `unknown`

## 🤖 Telegram Bot Commands

CouncilClaw includes a built-in Telegram bot with **20+ commands**. See **[Complete Telegram Commands Guide](docs/TELEGRAM_COMMANDS.md)** for:
- Core commands: `/start`, `/council`, `/help`
- Session management: `/new`, `/reset`, `/compact`
- Options: `/model`, `/thinking`, `/verbose`
- Status: `/status`, `/usage`, `/whoami`

**Quick setup during** `councilclaw setup` → Channels → Telegram (paste bot token from [@BotFather](https://t.me/BotFather))

## 🔌 API Documentation

CouncilClaw exposes a webhook API for programmatic task submission.

**Quick example:**
```bash
curl -X POST http://localhost:8787/task \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Design a REST API",
    "userId": "user-123",
    "channel": "slack",
    "chairmanModel": "openai/gpt-4.1"
  }'
```

**Response includes:**
- Task ID
- Council decision (complex vs simple)
- Chairman's final plan
- Peer reviews and dissent
- Timing breakdown per phase

**Full API Reference:** [docs/API.md](docs/API.md)

- **Endpoints**: `/health`, `/task`
- **Authentication**: Optional bearer token
- **Rate Limiting**: 30 req/60s per IP (configurable)
- **Error Handling**: Detailed error codes and context

## 🏗️ Architecture

High-level pipeline:

```
Input (CLI/API)
    ↓
Complexity Routing (simple vs. complex task?)
    ↓
If Simple → Skip deliberation → Chairman executes directly (fast)
If Complex → Decompose → Multi-model opinions → Peer review → Synthesize
    ↓
Guarded Execution (blocklist safety policy)
    ↓
Trace & Persist
```

**Key modules:**
- `src/council/*`: Deliberation and synthesis
- `src/llm/*`: Model management and API
- `src/execution/*`: Safe command execution
- `src/router/*`: Task complexity/type routing
- `src/cli/*`: Interactive interface
- `src/api/*`: Webhook server

Full architecture details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 🔒 Security & Validation

### Input Validation
- **Zod Schemas**: All inputs validated (task, webhook, config, environment)
- **Type Safety**: Full TypeScript with strict mode
- **Early Errors**: Invalid inputs fail fast with clear messages

### Command Execution
- **Permissive with Blocklist**: Most commands allowed, dangerous ones blocked
- **Blocked by default**: `shutdown`, `reboot`, `format`, `mkfs`, dangerous patterns
- **Command chaining**: `mkdir test && cd test` works if no dangerous patterns
- **Custom blocklist**: Configure during setup or via config

### API Security
- **Optional Bearer Auth**: `COUNCILCLAW_WEBHOOK_TOKEN`
- **IP Rate Limiting**: Per-origin tracking
- **Content-Type**: JSON only
- **Payload Limits**: 1MB max

### Model Access Control
- **Chairman Allowlist**: Restrict which models can synthesize
- **Validation**: Against built-in catalog

**Complete security policy:** [SECURITY.md](SECURITY.md)

## 📊 Observability & Debugging

### Debug Logging
```bash
DEBUG=true councilclaw chat
DEBUG=true npm start
```

### Execution Traces

Every run creates a trace with timing, decisions, and dissent:
```bash
# View traces as they're created
tail -f data/council-traces.jsonl | jq .
```

**Trace includes:**
- Timing breakdown (decomposition, first opinions, reviews, synthesis)
- Which models' proposals were selected
- Minority opinions (dissent)
- Task complexity decision
- Execution errors (if any)

## 🧪 Testing & Development

```bash
# Full verification (typecheck, lint, test, build)
npm run verify

# Run tests
npm test

# Watch mode
npm test -- --watch

# Build
npm run build

# Type check only
npm run typecheck

# Lint only
npm run lint
```

**Test files:** [src/__tests__/](src/__tests__/) - unit and integration tests

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](QUICK_START.md) | Commands cheat sheet (copy-paste recipes) |
| [docs/STARTUP.md](docs/STARTUP.md) | Run at boot (systemd/launchd) |
| [docs/CHANNEL_CONNECTION.md](docs/CHANNEL_CONNECTION.md) | Connect Telegram, Slack, Discord, etc. |
| [docs/API.md](docs/API.md) | Webhook API reference |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design & internals |
| [docs/TELEGRAM_COMMANDS.md](docs/TELEGRAM_COMMANDS.md) | Complete Telegram bot commands |
| [docs/MEMORY.md](docs/MEMORY.md) | Memory system guide |
| [SECURITY.md](SECURITY.md) | Security policy & vulnerability reporting |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |

## 🤝 Contributing

Contributions welcome! Before submitting a PR:

1. **Add tests** for new behavior
2. **Run** `npm run verify` (typecheck + lint + test + build)
3. **Update docs** for user-visible changes
4. **Keep safety defaults** intact

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

Licensed under **GNU GPL v3.0**. See [LICENSE](LICENSE) for details.

## 🔗 Links

- **GitHub**: [CouncilClaw/CouncilClaw](https://github.com/CouncilClaw/CouncilClaw)
- **API Docs**: [docs/API.md](docs/API.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Security**: [SECURITY.md](SECURITY.md)
- **OpenRouter**: [openrouter.ai](https://openrouter.ai)
- **Report security issues**: elishaodida@proton.me
