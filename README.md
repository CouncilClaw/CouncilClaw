# CouncilClaw

![CouncilClaw Banner](assets/branding/councilclaw-banner.jpg)

**CouncilClaw: Multi-model deliberation, single-agent execution.**

An intelligent LLM-powered system that combines multiple model perspectives for better decision-making. CouncilClaw uses deliberative processes—complexity routing, task decomposition, peer review, and synthesis—to deliver reliable results.

> ⚠️ **Experimental Build Notice**: CouncilClaw started as a vibe-coded prototype and is still evolving quickly. Validate outputs, review execution settings, and treat this release as fast-moving software—not a finalized enterprise platform.

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

## 🚀 Quick Start

### Installation
```bash
npm install
npm run build
```

### Using CouncilClaw Commands

After building, you can use the `councilclaw` command directly:

```bash
# Use councilclaw command (recommended)
councilclaw setup
councilclaw chat
councilclaw models

# Or use npm run (alternative, from project directory)
npm run setup
npm run chat
npm run models
```

If `councilclaw` command isn't found, install globally:
```bash
npm install -g .
```

### First-Time Setup (Recommended)
```bash
councilclaw setup
```
This interactive wizard (inspired by OpenClaw) will guide you through:
✓ **Risk acknowledgment** - Review important security/safety considerations
✓ **[1/4] API Configuration** - Set OpenRouter API key and base URL
✓ **[2/4] Model Selection** - Hierarchical selection (Provider → Versions)
✓ **[3/4] Channel Setup** - Select and configure communication channels (Slack, Discord, etc.)
✓ **[4/4] System Settings** - Port, blocked commands, and telegram bot commands

**Interactive Menu Features:**
- Keyboard navigation in TTY: `↑/↓` to move, `Space` to select/unselect, `Enter` to confirm
- **Hierarchical Model Selection**: Select by Provider (e.g., OpenAI, Google) then choose specific versions.
- Automatic derivation of allowed chairman models from your council selection
- Specific sub-wizards for configuring external channels like Telegram or Discord

### CLI Commands

**Start Interactive Chat:**
```bash
councilclaw chat                     # Start council deliberation
```

**Setup & Configuration:**
```bash
councilclaw setup                    # 🌟 Interactive configuration wizard (Grouped Mode)
councilclaw models                   # List 37 supported models by provider
councilclaw config show              # Display current configuration
councilclaw config set <key> <value> # Update configuration
```

**Alternative (using npm from project directory):**
```bash
npm run chat
npm run setup
npm run models
npm run cli -- config show
npm run cli -- config set <key> <value>
```

**Manual Configuration Keys:**
- `blocked_shell_commands`: Comma-separated list of commands to block.
- `telegram_commands`: Comma-separated list of commands for the Telegram bot.
- `council_models`: Comma-separated list of model IDs.

### Requirements
- **OpenRouter API Key**: Optional. Without it, chat runs in offline/stub mode.
- Run `councilclaw setup` (or `npm run setup`) to configure before first use

### Graceful Exit
- Type `exit` in chat mode to quit normally
- Press `Ctrl+C` for graceful exit with "Goodbye!" message (no error dumps)

### Chat Interface

When you run `councilclaw chat` (or `npm run chat`), CouncilClaw displays council deliberations in a clear format. For **simple tasks**, it skips the multi-model deliberation phase to save time:

```
[INFO] Simple task detected - skipping council opinions
📋 openai/gpt-4.1:
   Creating the folder 'new-project'...
   Done.

⏱️  450ms (decomp: 20ms | first: 0ms | review: 0ms | synthesis: 430ms)
```

**Output Explained:**
- **📋 Model Name**: Chairman model that synthesized the final answer
- **⏱️ Timing**: For simple tasks, `first` and `review` phases will show `0ms`.
- **💭 Dissent**: Alternative viewpoints from council members (Complex tasks only)
- **⚠️ Errors**: Clear error messages when issues occur

### Webhook Server
```bash
export OPENROUTER_API_KEY="your-api-key"
npm run dev:server
curl http://localhost:8787/health

# Submit a task
curl -X POST http://localhost:8787/task \
  -H "Content-Type: application/json" \
  -d '{"text":"Build a REST API"}'
```

### Configuration
```bash
# Save API credentials
councilclaw config set openrouter_api_key <KEY>

# Set council models
councilclaw config set council_models openai/gpt-4o-mini,google/gemini-2.0-flash,anthropic/claude-3.5-sonnet

# Override chairman model per request: use "chairmanModel" in POST /task or --chairman flag in CLI

# View current config
councilclaw config show
```

**Model Selection Limits:**
- Council models: minimum 0 (though reasoning requires models), maximum 8
- Chairman model is automatically picked from the council
- Starting with 2-3 models and adding diversity is recommended
- Each additional model increases deliberation time (~500-1000ms per model for complex tasks)

**Config file location:**
- `~/.config/councilclaw/config.json`
- Override with `COUNCILCLAW_CONFIG_PATH` environment variable

## 📋 Supported Models

CouncilClaw supports **37 models** across **8 providers**, giving you flexibility to choose models that match your needs while respecting cost and performance constraints.

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
- `meta-llama/llama-2-70b-chat`, `meta-llama/llama-3-8b`, `meta-llama/llama-3-70b`, `meta-llama/llama-3.1-8b`, `meta-llama/llama-3.1-70b`, `meta-llama/llama-3.3-70b`

**Mistral** (3 models)
- `mistralai/mistral-7b`, `mistralai/mistral-large`, `mistralai/mixtral-8x7b`

**Qwen** (3 models)
- `qwen/qwen-110b`, `qwen/qwen-32b`, `qwen/qwen-14b`

**Cohere & Others** (7 models)
- `cohere/command-r`, `cohere/command-r-plus`, and more.

**View Available Models:**
```bash
councilclaw models
# (or: npm run models)
```

This lists all 37 models grouped by provider with tier classification (fast/balanced/premium).

See full [Model Catalog](docs/ARCHITECTURE.md) for technical specifications.

## Communication Channels

Submit tasks via **13 different channels**, integrating CouncilClaw into your preferred platforms:

**Enterprise Messaging:**
- `slack` - Slack workspaces
- `teams` - Microsoft Teams
- `discord` - Discord servers
- `telegram` - Telegram bots (19+ commands - see [Telegram Commands](docs/TELEGRAM_COMMANDS.md))

**Decentralized & Legacy:**
- `matrix` - Matrix Protocol (decentralized chat)
- `irc` - IRC channels (legacy support)

**Direct Communication:**
- `email` - Email deliverables
- `whatsapp` - WhatsApp messages
- `cli` - Command-line interface

**API & Webhooks:**
- `http` - HTTP endpoints
- `grpc` - gRPC services
- `webhook` - Generic webhooks

**Unclassified:**
- `unknown` - Default/unmapped channels

**Example: Submit via Slack:**
```bash
curl -X POST http://localhost:8787/task \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Design notification system",
    "channel": "slack",
    "userId": "user-123"
  }'
```

## 🤖 Telegram Bot Commands

CouncilClaw Telegram bot supports **20+ slash commands** for rich interaction:

**Core:**
- `/start` - Initialize bot
- `/council` - Submit query to council
- `/help` - Show available commands
- `/commands` - List all commands

**Session Management:**
- `/new` - Start new session
- `/session` - Manage session settings
- `/reset` - Reset session context
- `/stop` - Stop running council deliberation
- `/compact` - Compress session context

**Options:**
- `/model` - View/set chairman model
- `/chairman` - Switch chairman mid-session
- `/models` - List available models
- `/thinking` or `/t` - Set thinking level (shallow/normal/deep)
- `/verbose` or `/v` - Toggle verbose mode

**Status & Info:**
- `/status` - Show current status
- `/context` - Explain memory context system
- `/whoami` - Show your user ID
- `/usage` - Show usage statistics

**[Complete Telegram Commands Guide →](docs/TELEGRAM_COMMANDS.md)**

## 🔌 API Documentation


Full API reference available at [docs/API.md](docs/API.md)

### POST /task
Submit a task for council deliberation.

**Request:**
```json
{
  "text": "Build a production-ready TypeScript API",
  "userId": "user-123",
  "channel": "slack",
  "chairmanModel": "openai/gpt-4.1"
}
```

**Response (200 OK):**
```json
{
  "ok": true,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "decision": { "label": "complex", "score": 0.85 },
    "chairmanPlan": { "finalChunks": [...] },
    "reports": [...],
    "trace": {
      "timing": {
        "decompositionMs": 150,
        "firstPassMs": 3200,
        "reviewMs": 2100,
        "synthesisMs": 1800,
        "executionMs": 5400,
        "totalMs": 12650
      }
    }
  }
}
```

**Authentication:**
```bash
# Optional token-based auth
curl -X POST http://localhost:8787/task \
  -H "Authorization: Bearer $COUNCILCLAW_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"build api tests"}'
```

**Rate Limiting:**
- Default: 30 requests per 60 seconds per IP
- Configure: `COUNCILCLAW_RATE_LIMIT`, `COUNCILCLAW_RATE_WINDOW_MS`
- Returns `429 Too Many Requests` with `retryAfterMs`

See [API Documentation](docs/API.md) for full endpoint specs and examples.

## 🏗️ Architecture

```
Input (CLI/API)
    ↓
Complexity Routing (simple vs. complex)
    ↓
Simple Task? → SKIP COUNCIL → Chairman Synthesis
    ↓
Complex Task? → Task Decomposition → Multi-Model Deliberation → Peer Review → Chairman Synthesis
    ↓
Guarded Execution (Permissive with Blocklist)
    ↓
Trace Persistence (telemetry storage)
```

For detailed architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 🔒 Security & Validation

### Input Validation
- **Zod Schemas**: All API inputs use Zod validation
  - `TaskEnvelope` - task structure validation
  - `WebhookPayload` - webhook request validation
  - `RuntimeEnv` - environment configuration validation
  - `CouncilClawConfig` - CLI config file validation
- **Early Validation Errors**: Invalid inputs fail fast with clear error messages
- **Type Safety**: Full TypeScript coverage with strict mode enabled

### Command Execution
- **Permissive with Safety Blocklist**: Most commands are allowed, but dangerous ones are blocked.
- **Core Blocked Commands**: `shutdown`, `reboot`, `format`, `mkfs`, and dangerous `rm` patterns.
- **User Blocked Commands**: Customize your blocklist during `councilclaw setup` (or `npm run setup`) or via `councilclaw config set blocked_shell_commands`.
- **Chaining Allowed**: Commands like `mkdir test && cd test` are now supported as long as they don't contain dangerous patterns.
- **Error Handling**: Captured and logged with exit codes

### API Security
- **Bearer Token Auth**: Optional `COUNCILCLAW_WEBHOOK_TOKEN`
- **IP Rate Limiting**: In-memory tracking per origin IP
- **Content-Type Enforcement**: Rejects non-JSON payloads
- **Payload Size Limits**: 1MB max request body

### Model Access Control
- **Chairman Allowlist**: Restrict which models can act as chairman
  - Configure: `ALLOWED_CHAIRMAN_MODELS` environment variable
- **Council Model Validation**: Validates against built-in catalog

See [SECURITY.md](SECURITY.md) for security policy and vulnerability reporting.

## 📊 Observability & Debugging

### Structured Logging
```bash
DEBUG=true npm run dev:server
```

Logs include:
- Request lifecycle (received, validated, executed, completed)
- Task execution phases with timing metrics
- Model API calls, retries, and failures
- Validation errors with field context
- Error stack traces for debugging

### Execution Tracing
Every council run generates a trace with:
- **Summary**: High-level outcome
- **Winners**: Models whose proposals were selected
- **Dissent**: Minority opinions and rationale
- **Timing Breakdown**: Duration per execution phase
- **Task Type**: Classification (coding, analysis, etc.)

Traces are persisted to `data/council-traces.jsonl` for analysis:
```bash
# View latest traces
tail -f data/council-traces.jsonl | jq .
```

### Error Context
All errors include:
- **Error Code**: Machine-readable error classification
- **Context**: Relevant fields/values that caused the error
- **Stack Trace**: Full call stack for debugging
- **Original Error**: Wrapped error details

## 🧪 Testing

```bash
# Full quality gate (same checks as CI)
npm run verify

# Run all tests
npm test

# Run specific test file
npm test -- src/__tests__/integration.test.ts

# Watch mode
npm test -- --watch
```

**Test Coverage:**
- Unit tests for routers, executors, and guardrails
- Integration tests for council pipeline
- Error handling and validation edge cases
- Input validation schemas
- Performance timing assertions

See test files in [src/__tests__/](src/__tests__/) for examples.

## 📚 Documentation

- [API Reference](docs/API.md) - Full webhook API specification with examples
- [Architecture Guide](docs/ARCHITECTURE.md) - System design and module responsibilities
- [Security Policy](SECURITY.md) - Security controls, vulnerability reporting, hardening roadmap

## 🔧 Configuration Reference

### Environment Variables

**Core:**
| Variable | Default | Description |
|----------|---------|-------------|
| `OPENROUTER_API_KEY` | (required) | OpenRouter API key |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | API endpoint |
| `OPENROUTER_MAX_RETRIES` | `2` | Retry attempts on failure |
| `OPENROUTER_RETRY_BASE_MS` | `500` | Backoff base delay |

**Server:**
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8787` | Webhook server port |
| `COUNCILCLAW_MODE` | `library` | Execution mode (server/cli/library) |
| `DEBUG` | `false` | Enable debug logging |

**Security:**
| Variable | Default | Description |
|----------|---------|-------------|
| `COUNCILCLAW_WEBHOOK_TOKEN` | (unset) | Optional bearer token for API auth |
| `COUNCILCLAW_RATE_LIMIT` | `30` | Requests per window |
| `COUNCILCLAW_RATE_WINDOW_MS` | `60000` | milliseconds |
| `ALLOWED_CHAIRMAN_MODELS` | (builtin) | Comma-separated allowlist |
| `BLOCKED_SHELL_COMMANDS` | `shutdown,reboot,format,mkfs` | Comma-separated blocklist |

**Storage:**
| Variable | Default | Description |
|----------|---------|-------------|
| `COUNCIL_TRACE_PATH` | `data/council-traces.jsonl` | Execution trace storage |
| `COUNCILCLAW_CONFIG_PATH` | `~/.config/councilclaw/config.json` | CLI config file |

## 📈 Results & Timing

Example execution trace showing performance breakdown:

```json
{
  "trace": {
    "timing": {
      "decompositionMs": 145,
      "firstPassMs": 3124,
      "reviewMs": 2087,
      "synthesisMs": 1834,
      "executionMs": 5412,
      "totalMs": 12602
    }
  }
}
```

Typical timing ranges:
- **Decomposition**: 100-300ms (task analysis)
- **First Pass**: 2-5s (concurrent model queries)
- **Review**: 1-3s (peer critique)
- **Synthesis**: 1-3s (chairman refinement)
- **Execution**: 0.5-10s (depends on task complexity)

## 🤝 Contributing

Contributions are welcome.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.

Quick checklist:
1. Add/update tests for behavior changes
2. Run `npm run verify` before submitting
3. Update docs for user-visible changes
4. Keep safety defaults intact

## 📄 License

This project is licensed under **GNU GPL v3.0**. See [LICENSE](LICENSE).

## 🔗 Links

- [Repository](https://github.com/CouncilClaw/CouncilClaw)
- [API Documentation](docs/API.md)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Security Policy](SECURITY.md)
- Security contact: **elishaodida@proton.me**
- [OpenRouter Models](https://openrouter.ai/models)
