# CouncilClaw API Documentation

## Overview
CouncilClaw exposes a webhook-based REST API for submitting tasks to the multi-model council deliberation engine. All endpoints return JSON and require `Content-Type: application/json`.

---

## Endpoints

### Health Check
**Endpoint:** `GET /health`

Check if the service is running.

**Response:**
```json
{
  "ok": true,
  "service": "councilclaw"
}
```

**Status Codes:**
- `200 OK` - Service is healthy

---

### Task Submission
**Endpoint:** `POST /task`

Submit a task for council deliberation and execution.

**Authentication:**
- Optional bearer token via `Authorization: Bearer <token>`
- If `COUNCILCLAW_WEBHOOK_TOKEN` env var is set, token is required
- Token mismatch returns `401 Unauthorized`

**Rate Limiting:**
- Default: 30 requests per 60 seconds per IP
- Configured via `COUNCILCLAW_RATE_LIMIT` and `COUNCILCLAW_RATE_WINDOW_MS`
- Rate limit exceeded returns `429 Too Many Requests` with `retryAfterMs`

**Content-Type:**
- Must be `application/json`
- Invalid content type returns `415 Unsupported Media Type`

**Request Body:**
```json
{
  "text": "your task description",
  "userId": "optional-user-id",
  "channel": "slack|discord|telegram|whatsapp|email|teams|matrix|irc|http|grpc|cli|webhook|unknown",
  "chairmanModel": "optional-model-id"
}
```

**Field Specifications:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | ✓ | Task description/prompt (min 1 char) |
| `userId` | string | ✗ | User identifier; defaults to `external-user` |
| `channel` | string | ✗ | Communication channel; defaults to `unknown` |
| `chairmanModel` | string | ✗ | Override chairman model (must be in allowlist) |

**Valid Channels:**
- `slack`, `discord`, `telegram`, `whatsapp`, `email`, `teams`, `matrix`, `irc`, `http`, `grpc`, `cli`, `webhook`, `unknown`

**Example Request:**
```bash
curl -X POST http://localhost:8787/task \
  -H "Authorization: Bearer $COUNCILCLAW_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Build a REST API for task management",
    "userId": "user-123",
    "channel": "slack",
    "chairmanModel": "openai/gpt-4.1"
  }'
```

**Successful Response (200 OK):**
```json
{
  "ok": true,
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "decision": {
      "label": "complex",
      "score": 0.78,
      "reason": "Task requires multi-step planning and integration"
    },
    "chairmanPlan": {
      "finalChunks": [...],
      "executionOrder": [...],
      "parallelGroups": [...],
      "fallbacks": [...],
      "rationale": "...",
      "chairmanModel": "openai/gpt-4.1"
    },
    "reports": [...],
    "trace": {
      "summary": "...",
      "winners": [...],
      "selectedChairmanModel": "openai/gpt-4.1",
      "taskType": "coding",
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

**Error Responses:**

| Status | Error | Reason |
|--------|-------|--------|
| `400` | Invalid JSON payload | JSON parse failed |
| `400` | Payload validation failed | Missing/invalid fields |
| `401` | Unauthorized | Missing or invalid auth token |
| `413` | Payload too large | Body exceeds 1MB |
| `415` | Content-Type must be application/json | Wrong content type |
| `429` | Rate limit exceeded | Too many requests; check `retryAfterMs` |
| `500` | Unknown server error | Internal server error |

**Error Response Format:**
```json
{
  "ok": false,
  "error": "error message",
  "retryAfterMs": 5000
}
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8787` | HTTP server port |
| `COUNCILCLAW_WEBHOOK_TOKEN` | (unset) | Optional bearer token for auth; if set, all requests require it |
| `COUNCILCLAW_RATE_LIMIT` | `30` | Max requests per window per IP |
| `COUNCILCLAW_RATE_WINDOW_MS` | `60000` | Rate limit window in milliseconds |
| `OPENROUTER_API_KEY` | (required) | OpenRouter API key for model calls |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `OPENROUTER_MAX_RETRIES` | `2` | Max retries on API failures |
| `OPENROUTER_RETRY_BASE_MS` | `500` | Base delay for exponential backoff |
| `COUNCIL_TRACE_PATH` | `data/council-traces.jsonl` | Path to trace storage |
| `DEBUG` | `false` | Enable debug logging (set to `true`) |
| `ALLOWED_CHAIRMAN_MODELS` | (default) | Comma-separated allowlist of chairman models |
| `ALLOWED_SHELL_COMMANDS` | `echo,ls,pwd,cat` | Comma-separated allowlist of shell commands |

### Starting the Server

```bash
export OPENROUTER_API_KEY="your-api-key"
export COUNCILCLAW_WEBHOOK_TOKEN="your-token"
export DEBUG=true

npm start
```

---

## Response Timing

The `timing` field in the trace provides breakdown of execution phases:

| Field | Description |
|-------|-------------|
| `decompositionMs` | Task decomposition into chunks |
| `firstPassMs` | Initial opinions from council models |
| `reviewMs` | Peer review and dissent detection |
| `synthesisMs` | Chairman refinement of plan |
| `executionMs` | Execution of planned chunks |
| `totalMs` | Total end-to-end duration |

---

## Examples

### Simple Task
```bash
curl -X POST http://localhost:8787/task \
  -H "Content-Type: application/json" \
  -d '{"text": "What is 2+2?"}'
```

### Complex Task with Model Override
```bash
curl -X POST http://localhost:8787/task \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Create a TypeScript API server with authentication",
    "userId": "developer-1",
    "channel": "slack",
    "chairmanModel": "openai/gpt-4.1"
  }'
```

### With Authentication
```bash
curl -X POST http://localhost:8787/task \
  -H "Authorization: Bearer sk-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"text": "Build a React component"}'
```

---

## Error Handling

All errors return a consistent JSON response with an `ok: false` flag and error message. Check the HTTP status code for classification:

- **4xx errors**: Client errors (invalid input, auth, rate limits)
- **5xx errors**: Server errors (internal failures)

Example error:
```json
{
  "ok": false,
  "error": "Webhook payload validation failed: 'text' is required"
}
```

---

## Monitoring

Monitor server logs with:
```bash
DEBUG=true npm start
```

Logs include:
- Request/response lifecycle
- Task execution phases and timing
- Model API calls and retries
- Validation and authorization events
- Error stack traces
