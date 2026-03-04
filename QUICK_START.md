# CouncilClaw Quick Reference Card

**Repository:** https://github.com/CouncilClaw/CouncilClaw

## First Time Setup (2 minutes)

```bash
# Step 1: Clone and install
git clone https://github.com/CouncilClaw/CouncilClaw.git && cd CouncilClaw
npm install && npm run build

# Step 2: Optionally install globally for easier access
npm install -g .

# Step 3: Run interactive setup
councilclaw setup
# (or: npm run setup)

# You'll be guided through:
# ✓ Risk acknowledgment
# ✓ OpenRouter API key (get one free at openrouter.ai)
# ✓ Model selection (1-8 models)
# ✓ Chairman model selection
# ✓ Communication channels (CLI, Slack, Discord, etc.)

# Step 4: Start using
councilclaw chat
# (or: npm run chat)
```

## OpenRouter API Key (Quick Setup)

```bash
# Option A: During interactive setup
councilclaw setup
# (or: npm run setup)
# → Paste your key when prompted

# Option B: After setup
councilclaw config set openrouter_api_key sk-or-xxx...
# (or: npm run cli -- config set openrouter_api_key sk-or-xxx...)

# Option C: Environment variable
export OPENROUTER_API_KEY=sk-or-xxx...
councilclaw chat
# (or: npm run chat)

# Get your free API key:
# → Visit https://openrouter.ai
# → Sign up (free $5 trial)
# → Copy key from Dashboard → Keys
```

**Need detailed help?** → See [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md)

## Core Commands

```bash
# Using councilclaw command (recommended)
councilclaw chat                     # Start interactive chat
councilclaw setup                    # Interactive wizard (full setup)
councilclaw config show              # Display current config
councilclaw config set key value     # Set a config value
councilclaw models                   # List 37 available models

# Using npm run (alternative, from project directory)
npm run chat
npm run setup
npm run cli -- config show
npm run cli -- config set key value
npm run models

# Build and development
npm run build                        # Build TypeScript
npm run typecheck                    # Check types
npm run test                         # Run tests
npm run dev:server                   # Start webhook API server
npm run dev                          # Development mode
```

## Common Configuration

```bash
# Set API key
councilclaw config set openrouter_api_key YOUR_KEY_HERE
# (or: npm run cli -- config set openrouter_api_key YOUR_KEY_HERE)

# Set council models (1-8)
councilclaw config set council_models openai/gpt-4o-mini,google/gemini-2.0-flash,anthropic/claude-3.5-sonnet
# (or: npm run cli -- config set council_models ...)

# Set chairman model
councilclaw config set chairman_model openai/gpt-4o-mini
# (or: npm run cli -- config set chairman_model ...)

# View current config
npm run cli -- config show

# Check which config file is used
cat ~/.config/councilclaw/config.json
```

## Cost-Efficient Model Selections

### 🔥 Cheapest (< $0.001 per query)
```bash
npm run cli -- config set council_models \
  openai/gpt-4o-mini,\
  google/gemini-2.0-flash
```

### ⭐ Recommended (< $0.01 per query)
```bash
npm run cli -- config set council_models \
  openai/gpt-4o-mini,\
  google/gemini-1.5-flash,\
  meta-llama/llama-2-70b-chat
```

### 💪 High Quality (< $0.20 per query)
```bash
npm run cli -- config set council_models \
  openai/gpt-4o,\
  google/gemini-1.5-pro,\
  anthropic/claude-3.5-sonnet
```

## Inline Model Override (During Chat)

```bash
# Override chairman for a single query
you> /chairman openai/gpt-4o What should we do?
# or
you> chairman: google/gemini-1.5-pro Design an API
```

## Chat Commands

```bash
you> What is 2+2?          # Ask a question
you> Design a REST API     # Ask for a design
you> /chairman gpt-4o Fix this bug    # Override chairman for this query
you> exit                  # Exit chat
```

Press `Ctrl+C` for graceful exit with "Goodbye!" message.

## Website Navigation

| Link | Purpose |
|------|---------|
| [openrouter.ai](https://openrouter.ai) | Create account, get API key |
| [openrouter.ai/dashboard](https://openrouter.ai/dashboard) | View usage, billing, keys |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Learn how CouncilClaw works |
| [docs/MEMORY.md](docs/MEMORY.md) | Learn about memory system |
| [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md) | Detailed OpenRouter setup |

## Troubleshooting Checklist

```bash
# API key not set?
npm run cli -- config show
# → Check openRouterApiKey field

# Getting "stub" responses?
# → Your API key isn't set or is wrong

# Getting "No content"?
# → Check your OpenRouter balance at dashboard

# Rate limited?
# → Wait a few minutes, OpenRouter will retry

# Want to test locally without API key?
# → Just run npm run chat
# → You'll get stub responses (for testing UI)
```

## File Locations

```
~/.config/councilclaw/
├── config.json           # Your configuration (keep secret!)
├── traces/               # Execution traces
│   └── *.jsonl          # Trace logs with timing
└── memory/               # Memory system (if enabled)
    ├── facts_*.json
    ├── messages_*.json
    └── session_*.json
```

## Environment Variables

```bash
# Override API key
export OPENROUTER_API_KEY=sk-or-xxx

# Override base URL
export OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Override config path
export COUNCILCLAW_CONFIG_PATH=/custom/path/config.json

# Enable debug logging
export DEBUG=true

# Set log level
export LOG_LEVEL=debug
```

## Development

```bash
# Install dependencies
npm install

# Type checking
npm run typecheck

# Run tests
npm run test

# Watch mode
npm run dev

# Build
npm run build

# Full verification (typecheck + test + build)
npm run verify
```

## API Usage (Webhook Mode)

```bash
# Start server
npm run dev:server
# Server listens on http://localhost:8787

# Check health
curl http://localhost:8787/health

# Submit a task
curl -X POST http://localhost:8787/task \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "Design a REST API",
    "userId": "user-123",
    "chairmanModel": "openai/gpt-4o-mini"
  }'
```

## Important Notes

### Security
- 🔒 Never commit API key to version control
- 🔒 Don't share your key in Slack/Discord/public repos
- 🔒 Treat it like a password
- 🔒 Config file stored in `~/.config/` (not in repo)

### Costs
- 💰 Only pay for tokens you use
- 💰 Start with free $5 trial on OpenRouter
- 💰 Set spending limits to prevent surprises
- 💰 Use cheaper models (`gpt-4o-mini`) to reduce costs

### Memory System
- 🧠 Automatically learns from your queries
- 🧠 Stored locally in `~/.config/councilclaw/memory/`
- 🧠 Never sent to external servers
- 🧠 Makes recommendations better over time

## Getting Help

```bash
# View command help
npm run --help

# See available models
npm run models

# View current configuration
npm run cli -- config show

# For OpenRouter issues
# → Visit https://openrouter.ai/docs
# → Check Discord community (openrouter.ai)

# For CouncilClaw issues
# → See README.md
# → Check GitHub issues
# → Review docs/ARCHITECTURE.md
```

---

**Quick Start:** `npm run setup` → `npm run chat` → Done! 🚀

For detailed OpenRouter setup, see [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md)
