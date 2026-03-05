# OpenRouter Setup Visual Guide

## Setup Flow Diagram

```
START
  ↓
┌─────────────────────────────────────┐
│  Visit openrouter.ai                │
│  Click "Sign Up"                    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Choose signup method:              │
│  • Email + password                 │
│  • GitHub                           │
│  • Google                           │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  ✓ Account created!                 │
│  ✓ Free $5 trial added              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Go to Dashboard                    │
│  → Click "Keys" in sidebar          │
│  → Copy your API key                │
│  → Key starts with: sk-or-          │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  In CouncilClaw:                    │
│                                     │
│  npm run setup                      │
│  (paste your key when asked)        │
│                                     │
│  OR                                 │
│                                     │
│  npm run cli -- config set \        │
│    openrouter_api_key YOUR_KEY      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Test it:                           │
│  npm run chat                       │
│  you> What is 2+2?                  │
│  📋 gpt-4o-mini:                    │
│     2+2 = 4                         │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  ✅ YOU'RE READY!                   │
│                                     │
│  Start using CouncilClaw with:      │
│  • Real AI responses               │
│  • Multi-model council             │
│  • Memory system                   │
└─────────────────────────────────────┘
```

## Dashboard Navigation Map

```
openrouter.ai/dashboard
├── 📊 Dashboard (Home)
│   └── View recent activity
│       API status
│       Quick actions
│
├── 🔑 Keys / API Keys
│   ├── View your API key
│   ├── Copy to clipboard
│   ├── Regenerate (rotate key)
│   └── ✅ THIS IS WHAT YOU NEED!
│
├── 💳 Billing
│   ├── Add payment method
│   ├── View usage
│   ├── Usage history graph
│   ├── Set spending limits
│   └── View token costs per model
│
└── ⚙️  Settings
    ├── Account info
    ├── Security
    └── Preferences
```

## Key Location (Screenshot Description)

```
Dashboard Page:
┌─────────────────────────────────────────────────────┐
│ OpenRouter Dashboard                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  LEFT SIDEBAR:                                      │
│  ✓ Dashboard                                        │
│  ✓ Keys ← CLICK HERE                               │
│  ✓ Billing                                          │
│  ✓ Settings                                         │
│                                                     │
│  MAIN AREA (once you click Keys):                   │
│  ┌─────────────────────────────────────────┐       │
│  │ Your API Keys                            │       │
│  ├─────────────────────────────────────────┤       │
│  │ sk-or-xxx-xxxx-xxx-xxx-xxxx-xxx [COPY]  │ ←───── THIS IS YOUR KEY
│  │ Created: Mar 4, 2024                    │       │
│  │ Last used: Mar 4, 2024                  │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  [Regenerate Key] [Revoke Key]                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## What Your API Key Looks Like

```
✅ VALID KEY FORMAT:
   sk-or-xxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

❌ INVALID KEY FORMAT:
   sk-1234... (wrong prefix, not from OpenRouter)
   your-api-key (not formatted correctly)
   "" (empty)

⚠️  IMPORTANT:
   • Always starts with "sk-or-"
   • Contains only alphanumeric and hyphens
   • About 50+ characters long
   • Keep it SECRET!
```

## OpenRouter to CouncilClaw Flow

```
┌──────────────────────────────────────┐
│   OpenRouter (LLM Provider)          │
│   Provides access to 100+ models     │
│   (OpenAI, Google, Anthropic, etc)   │
└────────────────┬─────────────────────┘
                 │
                 │ Your API Key
                 │ (sk-or-xxx...)
                 │
                 ▼
┌──────────────────────────────────────┐
│   CouncilClaw (Your Application)     │
│                                      │
│   • Council Deliberation             │
│   • Model Selection                  │
│   • Memory System                    │
│   • Execution Tracking               │
└────────────────┬─────────────────────┘
                 │
         ┌───────┴────────┐
         ▼                ▼
    ┌─────────┐      ┌─────────┐
    │ Local   │      │ External│
    │ Results │      │ APIs    │
    └─────────┘      └─────────┘
```

## Cost Visualization

```
Single Query Cost Estimation:

Budget Setup:
  gpt-4o-mini (0.15/1M) + gemini-2.0-flash (free) = ~$0.001

Balanced Setup:
  gpt-4o-mini + gemini-1.5-flash + llama = ~$0.01

Premium Setup:
  gpt-4o + gemini-1.5-pro + claude-3.5-sonnet = ~$0.20

┌─────────────────────────────────────┐
│ Monthly Budget Examples:             │
├─────────────────────────────────────┤
│ 10 queries/day × $0.001 = $0.30/mo  │
│ 50 queries/day × $0.01  = $15/mo    │
│ 100 queries/day × $0.01 = $30/mo    │
└─────────────────────────────────────┘

Cost Tracker:
  https://openrouter.ai/dashboard
  → Billing → Usage
  → See tokens used and cost
```

## OpenRouter Account States

```
1. NEW ACCOUNT
   ✅ Free $5 trial
   ✅ Can test models
   ❌ Can't use beyond $5
   → Action: Add payment method when $5 runs out

2. ACCOUNT WITH BILLING
   ✅ Unlimited use (within spending limits)
   ✅ Set daily/monthly caps
   ✅ Automatic payments
   → Action: Set spending alerts

3. RATE LIMITED
   ⏸️  Too many requests in short time
   ✅ OpenRouter auto-retries
   → Action: Wait a few minutes, retry

4. OUT OF BALANCE
   ⚠️  Used all $5 trial
   ❌ Can't make API calls
   ✅ Responses will error
   → Action: Add billing info

5. ACCOUNT SUSPENDED
   ❌ Violated terms or fraud detected
   → Action: Contact OpenRouter support
```

## Checklist: Am I Set Up Correctly?

```
OpenRouter Account:
  ☐ Created account at openrouter.ai
  ☐ Verified email
  ☐ Have API key (sk-or-xxx...)
  ☐ Can see dashboard
  ☐ Added payment method (optional for trial)

CouncilClaw:
  ☐ npm install completed
  ☐ npm run setup ran successfully
  ☐ Pasted API key when asked
  ☐ Ran npm run models (see 33 models list)
  ☐ npm run chat started without errors

Testing:
  ☐ npm run chat
  ☐ Type: "What is 2+2?"
  ☐ See: Real council responses (not "Stub response")
  ☐ See: Timing info (⏱️ XXms)
  ☐ See: Multiple model opinions

If any ☐ is unchecked:
  → Go back to [docs/OPENROUTER_SETUP.md](OPENROUTER_SETUP.md)
  → Or [QUICK_START.md](QUICK_START.md) troubleshooting
```

## Side-by-Side: OpenRouter vs CouncilClaw

```
OPENROUTER                          COUNCILCLAW
═══════════════════════════════════════════════════════════
Access to 100+ LLM models    →      Uses N models in council
Handles API rate limits      →      Focuses on reasoning
Token-based pricing          →      No additional costs
Single model at a time       →      Multiple models debate
Manual response selection    →      Automatic synthesis

                    They work together!
                    OpenRouter API ←→ CouncilClaw

You need:          One OpenRouter API Key
                   = Access to 100+ models
                   = Multi-model council deliberation
                   = Full memory system
```

## Quick Command Reference Map

```
┌─────────────────────────────────────┐
│ DO THIS ONCE (First Time):          │
├─────────────────────────────────────┤
│ 1. npm install                      │
│ 2. npm run setup                    │
│    (paste your API key here)        │
│ 3. npm run chat                     │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ DO THIS DAILY (Using CouncilClaw):  │
├─────────────────────────────────────┤
│ npm run chat                        │
│ you> Your question here             │
│ you> exit (to quit)                 │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ DO THIS IF SOMETHING BREAKS:        │
├─────────────────────────────────────┤
│ npm run cli -- config show          │
│   (check API key is set)            │
│                                     │
│ npm run models                      │
│   (check models can load)           │
│                                     │
│ npm run verify                      │
│   (run full test suite)             │
│                                     │
└─────────────────────────────────────┘
```

---

**Still confused?** → Read [docs/OPENROUTER_SETUP.md](docs/OPENROUTER_SETUP.md) for step-by-step text guide with screenshots.
