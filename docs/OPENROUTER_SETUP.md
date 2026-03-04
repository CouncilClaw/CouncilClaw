# OpenRouter Setup Guide

This guide walks you through setting up OpenRouter API access for CouncilClaw, so you can use multiple LLM providers through a single unified API.

## What is OpenRouter?

**OpenRouter** is an API aggregator that provides unified access to 100+ LLM models from multiple providers:
- **OpenAI** (GPT-4, GPT-4o, o1)
- **Google** (Gemini)
- **Anthropic** (Claude)
- **Meta** (Llama)
- **xAI** (Grok)
- And many more...

Think of it as a router that sends requests to the best available model while handling rate limits and fallbacks automatically.

## Why Use OpenRouter?

✅ **Single API Key** - No need to manage keys for each LLM provider separately
✅ **Cost Efficient** - Pay per token used; often cheaper than direct provider APIs
✅ **Model Variety** - Access 100+ models with one integration
✅ **Automatic Fallbacks** - Gracefully handles rate limits and failures
✅ **No Rate Limit Issues** - OpenRouter's infrastructure handles scale
✅ **Production Ready** - Used by organizations of all sizes

## Step-by-Step Setup

### Step 1: Create an OpenRouter Account

1. Visit **[openrouter.ai](https://openrouter.ai)**

2. Click **"Sign Up"** in the top right corner

3. You can sign up using:
   - Email + password
   - GitHub account
   - Google account

4. Verify your email (if using email signup)

5. Complete your profile:
   - Agree to terms
   - Optionally add billing info now (free $5 trial available)

### Step 2: Access Your API Key

1. After signing up, go to your **[Dashboard](https://openrouter.ai/dashboard)**

2. In the left sidebar, click **"Keys"** or **"API Keys"**

3. You'll see a default API key generated for you

4. Click the **"Copy"** button next to your key to copy it to clipboard

   ```
   Your key will look like:
   sk-or-xxx-xxxxxxxxxxxxxxxxxxxx
   ```

5. **Keep this key secret!**
   - Don't share it in public repos
   - Don't commit it to version control
   - Treat it like a password

### Step 3: Set Up Billing (Optional but Recommended)

To use OpenRouter beyond the free $5 trial:

1. In the dashboard, click **"Billing"** in the left sidebar

2. Add a payment method:
   - Credit/debit card
   - Stripe, Google Pay, Apple Pay

3. Set spending limits (optional):
   - Daily limit
   - Monthly limit
   - This prevents unexpected charges

**Pricing:**
- Pay only for tokens you use
- Prices vary by model
- Example: `gpt-4o-mini` = **$0.15 per 1M input tokens**
- Try free $5 credit first!

### Step 4: Configure CouncilClaw with Your API Key

**Option A: Interactive Setup (Recommended)**

```bash
npm run setup
```

When prompted for your OpenRouter API key:
```
OpenRouter API Key []: sk-or-xxx-xxxxxxxxxxxxxxxxxxxx
```

Paste your API key and press Enter.

**Option B: Manual Configuration**

```bash
npm run cli -- config set openrouter_api_key sk-or-xxx-xxxxxxxxxxxxxxxxxxxx
```

**Option C: Environment Variable**

```bash
export OPENROUTER_API_KEY=sk-or-xxx-xxxxxxxxxxxxxxxxxxxx
npm run chat
```

### Step 5: Test Your Setup

1. Start CouncilClaw chat:
   ```bash
   npm run chat
   ```

2. Type a simple test query:
   ```
   you> What is 2+2?
   ```

3. You should see council member responses within a few seconds

4. If you see real responses (not "stub" responses), your API key is working! ✅

## Troubleshooting

### "Model error: missing OPENROUTER_API_KEY"

**Problem:** API key not set or not recognized

**Solutions:**
1. Check your key is set correctly:
   ```bash
   npm run cli -- config show
   ```
   Should show `openRouterApiKey: "sk-or-xxx..."`

2. Verify the key is correct:
   - Copy it again from [openrouter.ai/dashboard](https://openrouter.ai/dashboard)
   - Make sure there are no extra spaces
   - Make sure you copied the entire key

3. Try setting it again:
   ```bash
   npm run cli -- config set openrouter_api_key YOUR_KEY_HERE
   ```

### "No content from openai/gpt-4o"

**Problem:** API call succeeded but model returned empty response

**Solutions:**
1. Check your OpenRouter balance:
   - Visit [openrouter.ai/dashboard](https://openrouter.ai/dashboard)
   - Click "Billing" → "Usage"
   - If balance is $0, add payment method

2. Your query might be too long - try a shorter query

3. Model might be temporarily unavailable - try a different model:
   ```bash
   npm run models  # List available models
   npm run cli -- config set council_models openai/gpt-4o-mini,google/gemini-2.0-flash
   ```

### "401 Unauthorized"

**Problem:** API key is invalid or expired

**Solutions:**
1. Verify API key hasn't been revoked:
   - Log into [openrouter.ai](https://openrouter.ai)
   - Check if you can load the dashboard

2. Regenerate your API key:
   - Dashboard → Keys → "Regenerate" button
   - Update CouncilClaw with new key:
     ```bash
     npm run cli -- config set openrouter_api_key NEW_KEY
     ```

3. Make sure key starts with `sk-or-`:
   - If it doesn't, you might have copied the wrong key

### "429 Too Many Requests"

**Problem:** Rate limited by OpenRouter

**Solutions:**
1. Wait a few minutes and retry
2. OpenRouter automatically handles retries
3. If persistent, you might need a paid plan
   - Free tier has limited requests
   - Paid tiers have higher limits

### "Model price too high"

**Problem:** Selected models exceed your budget

**Solutions:**
1. Check model costs:
   ```bash
   npm run models
   ```
   Look at the tier column

2. Switch to cheaper models:
   - `gpt-4o-mini` - Fast + cheap ⭐ Recommended
   - `gemini-2.0-flash` - Free + great quality
   - `meta-llama/llama-2-70b-chat` - Very cheap

3. Limit your council size:
   ```bash
   npm run cli -- config set council_models openai/gpt-4o-mini,google/gemini-2.0-flash
   ```

## Best Practices

### 💰 Cost Optimization

1. **Start with free tier:**
   - Use `gpt-4o-mini` (very cheap)
   - Use `gemini-2.0-flash` (free tier)
   - Use smaller council (2-3 models)

2. **Example cost-effective council:**
   ```bash
   npm run cli -- config set council_models \
     openai/gpt-4o-mini,\
     google/gemini-2.0-flash,\
     deepseek/deepseek-chat
   ```
   Estimated cost: **$0.001 per complex query**

3. **Monitor usage:**
   - Dashboard → Billing → Usage
   - Track daily spending
   - Set spending limits during setup

4. **Scale models with complexity:**
   - Simple queries: Use cheap models
   - Complex analysis: Use premium models (like gpt-4o)

### 🔐 Security Best Practices

1. **Never commit API key to git:**
   ```bash
   # ❌ DON'T DO THIS
   git add config.json  # If it contains API key

   # ✅ DO THIS
   # Keep config in ~/.config/councilclaw/
   # It's in .gitignore by default
   ```

2. **Don't share your API key:**
   - Not in Slack, Discord, email
   - Not in code reviews
   - Not in public gists

3. **Rotate key regularly:**
   - Dashboard → Keys → Regenerate
   - Every 3-6 months
   - Immediately if leaked

4. **Use spending limits:**
   - Set daily/monthly caps
   - Prevents runaway costs
   - Alert on high usage

### 📊 Monitoring

Check your usage regularly:

```bash
# View config
npm run cli -- config show

# List models and their tiers
npm run models

# Check usage in web dashboard
# https://openrouter.ai/dashboard
```

## Getting Help

If you get stuck:

1. **Check OpenRouter docs:** [openrouter.ai/docs](https://openrouter.ai/docs)

2. **OpenRouter Community:** [Discord server available on their site](https://openrouter.ai)

3. **CouncilClaw Issues:** [GitHub Issues](https://github.com/your-org/councilclaw/issues)

4. **Test your key:**
   ```bash
   curl -X POST https://openrouter.ai/api/v1/chat/completions \
     -H "Authorization: Bearer sk-or-xxx-xxxxxxxxxxxxxxxxxxxx" \
     -H "Content-Type: application/json" \
     -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
   ```
   If you get a response, your key works!

## Examples: Different Model Configurations

### **Budget Option** (< $0.01 per query)
```bash
npm run cli -- config set council_models \
  openai/gpt-4o-mini,\
  google/gemini-2.0-flash,\
  meta-llama/llama-2-70b-chat
```

### **Balanced Option** ($0.05-0.10 per query)
```bash
npm run cli -- config set council_models \
  openai/gpt-4o-mini,\
  google/gemini-1.5-pro,\
  anthropic/claude-3.5-sonnet
```

### **Premium Option** ($0.20-0.50 per query)
```bash
npm run cli -- config set council_models \
  openai/gpt-4o,\
  google/gemini-1.5-pro,\
  anthropic/claude-3.5-sonnet
```

### **Super Budget** (Simplest, free to use)
```bash
npm run cli -- config set council_models \
  google/gemini-2.0-flash
```
(Single model, but powered by free OpenRouter tier)

## Next Steps

1. ✅ Create OpenRouter account
2. ✅ Get API key
3. ✅ Run `npm run setup` and enter your key
4. ✅ Run `npm run chat` and test
5. ✅ Check [docs/MEMORY.md](./MEMORY.md) to learn about memory system
6. ✅ Read [docs/ARCHITECTURE.md](./ARCHITECTURE.md) for how council deliberation works

---

**Questions?** See the [main README](README.md) or visit [openrouter.ai](https://openrouter.ai).
