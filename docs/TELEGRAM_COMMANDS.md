# CouncilClaw Telegram Commands

CouncilClaw supports 20+ Telegram bot commands for managing sessions, configuring options, and checking status. These commands enable rich interaction with the council through Telegram.

## Command Categories

### Core Commands

#### `/start`
Initialize or restart the Telegram bot.
- **Usage:** `/start`
- **Response:** Welcome message and available commands

#### `/council`
Submit a query to the council for deliberation.
- **Usage:** `/council Design a REST API`
- **Response:** Council deliberation result with timing and dissent (if any)

---

### Session Management

#### `/session`
Manage session-level settings (TTL, context size, retention).
- **Usage:** `/session` (view current) or `/session ttl 3600` (set TTL)
- **Response:** Current session settings

#### `/new`
Start a new session (closes current session).
- **Usage:** `/new`
- **Response:** New session ID and fresh context

#### `/reset`
Reset the current session context while keeping the session alive.
- **Usage:** `/reset`
- **Response:** Confirmation that session has been reset

#### `/stop`
Stop any currently running council deliberation.
- **Usage:** `/stop`
- **Response:** Confirmation of stopped run

#### `/compact`
Compress/summarize the session context to maintain history while reducing token usage.
- **Usage:** `/compact`
- **Response:** Summary statistics and compression confirmation

---

### Options & Configuration

#### `/thinking` or `/t`
Set the thinking/reasoning level for council members.
- **Usage:** `/thinking deep` (or `/t deep`)
- **Options:** `shallow`, `normal`, `deep`
- **Response:** Confirmation of new thinking level
- **Effect:** Deeper thinking increases response time and token usage

#### `/verbose` or `/v`
Toggle verbose output mode (shows more details in responses).
- **Usage:** `/verbose` or `/v`
- **Response:** Current verbose mode status (on/off)

#### `/model`
Show the current chairman model or switch models.
- **Usage:** `/model` (view) or `/model openai/gpt-4o` (switch)
- **Response:** Current or new model information

#### `/chairman`
Switch the chairman model directly without creating a new session.
- **Usage:** `/chairman` (view current) or `/chairman anthropic/claude-3.5-sonnet` (switch)
- **Response:** Current or new chairman model information
- **Effect:** Changes the model that synthesizes the council's responses while maintaining session context and history
- **Validation:** Model must be in the allowedChairmanModels list

#### `/models`
List available models by provider or search specific provider.
- **Usage:** `/models` (list all) or `/models openai` (filter by provider)
- **Response:** Grid of available models with tier information

---

### Status & Context

#### `/help`
Show available commands with brief descriptions.
- **Usage:** `/help`
- **Response:** Help text with all commands

#### `/commands`
List all slash commands in command menu format.
- **Usage:** `/commands`
- **Response:** Telegram menu showing all available commands

#### `/status`
Show current status: session info, model, settings, usage.
- **Usage:** `/status`
- **Response:** Formatted status including:
- Current session ID
- Chairman model
- Thinking level
- Message count
- Token usage (approx)

#### `/context`
Explain how the memory system builds and uses context.
- **Usage:** `/context`
- **Response:** Explanation of:
- How past decisions are remembered
- What facts are extracted
- How context is injected into prompts
- Confidence scoring

#### `/whoami`
Show your Telegram user ID and sender information.
- **Usage:** `/whoami`
- **Response:** User ID, username, and session binding

---

### Usage & Cost

#### `/usage`
Show current usage statistics and approximate cost.
- **Usage:** `/usage`
- **Response:** Statistics including:
- Messages sent this session
- Total council runs
- Approximate API cost
- Token usage breakdown

---

## Usage Examples

### Example 1: Basic Query
```
User: /council Design a caching layer for high-traffic API
Bot:  📋 Council Deliberation Result:
      [response with timing and dissent]
```

### Example 2: Switching Models
```
User: /models
Bot:  Available models:
      • openai/gpt-4o
      • google/gemini-2.0-flash
      • anthropic/claude-3.5-sonnet
      
User: /model google/gemini-2.0-flash
Bot:  ✅ Switched to google/gemini-2.0-flash
```

### Example 3: Session Management
```
User: /status
Bot:  📊 Current Status:
      Session: abc-123-def
      Model: openai/gpt-4o
      Thinking: normal
      Messages: 5
      
User: /compact
Bot:  ✅ Session compacted
      From 2847 tokens → 1203 tokens (57% reduction)
      
User: /new
Bot:  🆕 New session created: xyz-789-abc
      Previous session archived
```

### Example 4: Configuration
```
User: /thinking deep
Bot:  ✅ Thinking level set to deep
      (Responses may take 10-30 seconds longer)
      
User: /verbose
Bot:  ✅ Verbose mode ON
      
User: /v
Bot:  ✅ Verbose mode OFF
```

### Example 5: Context & Usage
```
User: /context
Bot:  📚 Memory Context System:
      CouncilClaw learns from your decisions...
      [explanation of how context is used]
      
User: /usage
Bot:  📊 Usage for this session:
      API calls: 12
      Approx cost: $0.23
      Tokens: ~4,500
```

---

## Command Parameters

### Model Names
Use provider/model format (case-sensitive):
- `openai/gpt-4o`
- `google/gemini-2.0-flash`
- `anthropic/claude-3.5-sonnet`

### Thinking Levels
- `shallow` - Fast responses, minimal reasoning
- `normal` - Balanced (default)
- `deep` - Extended reasoning, comprehensive analysis

### Session Settings
- `ttl <seconds>` - Session time-to-live (3600-86400)
- `max_messages <n>` - Maximum messages to keep (10-500)
- `retain <days>` - Days to physically retain session (1-30)

---

## Configuration in CouncilClaw

### Setting Telegram Commands

During setup:
```bash
councilclaw setup
# → Select "Telegram" as channel
# → Enter commands (comma-separated)
```

Or via command:
```bash
councilclaw config set telegram_commands /council,/help,/status,/model,/models
```

### Default Commands
CouncilClaw comes with these default Telegram commands:
```
/start, /council, /help, /commands, /status, /new, /session, /reset, /stop,
/model, /models, /thinking, /t, /verbose, /v, /context, /whoami, /usage, /compact
```

You can customize this list to include only the commands you want.

---

## Tips & Best Practices

### 1. **Start with `/help`**
   Always begin with `/help` to see available commands

### 2. **Use `/status` Before Complex Queries**
   Check your current model and settings before submitting complex queries

### 3. **Session Management**
   - Use `/new` between different working contexts
   - Use `/reset` to clear context without starting fresh
   - Use `/compact` to improve response times in long sessions

### 4. **Thinking Levels**
   - Use `shallow` for quick answers
   - Use `deep` for complex analysis or important decisions

### 5. **Check `/usage` Regularly**
   Monitor costs if you're on a paid OpenRouter plan

### 6. **Context Awareness**
   Use `/context` to understand how the memory system influences recommendations

---

## Aliases (Short Commands)
- `/t` → `/thinking`
- `/v` → `/verbose`

---

## Troubleshooting

### "Unknown command" error
- Check command spelling (case-sensitive)
- Use `/commands` to see all available commands
- Verify command is enabled in your configuration

### Session expired
- Use `/new` to start a fresh session
- Check your session TTL with `/session`

### Model not found
- Use `/models` to list available options
- Check exact provider/model format

---

## Integration with Memory System

All Telegram commands integrate with CouncilClaw's memory system:
- Your decisions are remembered across sessions
- Preferences are respected in future queries
- The system learns from council deliberations
- Context is automatically injected into prompts

Use `/context` to learn how this works!

---

For more information, see:
- [Memory System](./MEMORY.md)
- [Architecture](./ARCHITECTURE.md)
- [Quick Start](../QUICK_START.md)
