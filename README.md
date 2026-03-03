# CouncilClaw

![CouncilClaw Banner](assets/branding/councilclaw-banner.jpg)

**CouncilClaw: Multi-model deliberation, single-agent execution.**

An intelligent LLM-powered system that combines multiple model perspectives for better decision-making. CouncilClaw uses deliberative processes—complexity routing, task decomposition, peer review, and synthesis—to deliver reliable results.

## ✨ Features

- **Multi-Model Consensus**: Harness opinions from multiple LLMs (OpenAI, Google, Anthropic, xAI, Meta)
- **Complexity Routing**: Automatically route simple vs. complex tasks to appropriate deliberation pipelines
- **Task Decomposition**: Break complex requests into manageable, parallel-executable chunks
- **Blind Peer Review**: Anonymous model critiques detect flawed proposals before execution
- **Chairman Synthesis**: A designated model synthesizes diverse opinions into a coherent plan
- **Guarded Execution**: Allowlist-based command execution with automatic error handling
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

### First-Time Setup Warning
⚠️ **Important**: On first use, CouncilClaw will display a **Risks and Responsibilities** warning in an interactive prompt. You must explicitly accept the terms to proceed. This includes:

- Command execution (shell commands via allowlist)
- External API calls (to LLM providers)
- Local storage of execution traces
- Webhook API access capabilities

You will be asked to type `yes` to accept the risks. This helps ensure you understand the security implications before using CouncilClaw.

### CLI Chat
```bash
npm run cli -- configure    # Interactive setup wizard (includes terms acceptance)
npm run cli -- chat         # Start interactive council chat (includes terms on first run)
npm run cli -- models       # List supported models
```

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
npm run cli -- config set openrouter_api_key <KEY>

# Set council models
npm run cli -- config set council_models openai/gpt-4.1-mini,google/gemini-2.5-flash

# Set chairman model
npm run cli -- config set chairman_model openai/gpt-4.1

# View current config
npm run cli -- config show
```

**Config file location:**
- `~/.config/councilclaw/config.json`
- Override with `COUNCILCLAW_CONFIG_PATH` environment variable

## 📋 Supported Models

**Default Council:**
- `openai/gpt-4.1-mini` (fast, cost-effective)
- `google/gemini-2.5-flash` (multimodal, fast)

**Premium Models:**
- `openai/gpt-4.1` (highest quality)
- `google/gemini-2.5-pro` (advanced reasoning)
- `anthropic/claude-3.5-sonnet` (nuanced reasoning)
- `anthropic/claude-3.7-sonnet` (improved performance)

**Open Models:**
- `x-ai/grok-4` (general knowledge)
- `meta-llama/llama-3.3-70b-instruct` (instruction-tuned)

See full [Model Catalog](docs/ARCHITECTURE.md) for details.

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
Task Decomposition (into chunks)
    ↓
First Opinions (multi-model council vote)
    ↓
Anonymization (blind review preparation)
    ↓
Peer Review (critique & dissent detection)
    ↓
Chairman Synthesis (consensus building)
    ↓
Guarded Execution (command allowlist)
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
- **Allowlist-Based**: Only whitelisted commands can execute
  - Default: `echo`, `ls`, `pwd`, `cat`
  - Configure: `ALLOWED_SHELL_COMMANDS` environment variable
- **Chain Prevention**: Blocks command chaining (`&&`, `|`, `;`)
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
| `ALLOWED_SHELL_COMMANDS` | `echo,ls,pwd,cat` | Comma-separated allowlist |

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

Contributions welcome! Please:
1. Add tests for new features
2. Run `npm test` before submitting
3. Update documentation as needed
4. Follow existing code style (strict TypeScript)

## 📄 License

See LICENSE file.

## 🔗 Links

- [API Documentation](docs/API.md)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Security Policy](SECURITY.md)
- [OpenRouter Models](https://openrouter.ai/models)

