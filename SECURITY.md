# Security Policy

## Reporting a Vulnerability
Please do not open public issues for security vulnerabilities.
Email the maintainer privately at **elishaodida@proton.me** with:
- impact
- steps to reproduce
- affected versions/commits

## Current Security Controls
- **Command execution**: Blocklist-based. Core blocklist: `shutdown`, `reboot`, `format`, `mkfs`; dangerous patterns (e.g. `rm -rf /`, `dd` to `/dev/`) are blocked. User-defined blocklist via `BLOCKED_SHELL_COMMANDS`. Chaining (e.g. `&&`) is allowed; only blocked commands and dangerous patterns are rejected.
- **Chairman model override**: Allowlist-gated via `ALLOWED_CHAIRMAN_MODELS` (or derived from council selection).
- **Model calls**: Retry/backoff via `OPENROUTER_MAX_RETRIES` and `OPENROUTER_RETRY_BASE_MS`.
- **Webhook API**: Optional bearer token (`COUNCILCLAW_WEBHOOK_TOKEN`); when set, requests without a valid token are rejected with 401.
- **Rate limiting**: In-memory per-IP rate limiting (`COUNCILCLAW_RATE_LIMIT`, `COUNCILCLAW_RATE_WINDOW_MS`); 429 with `retryAfterMs` when exceeded.
- **Input validation**: Zod schemas for task envelope, webhook payload, and config; payload size limit (1MB) on POST /task.

## Hardening Roadmap
- Make webhook token required in production (e.g. env-driven strict mode).
- Signed webhook verification for channel integrations.
- Stricter output validation before shell execution.
