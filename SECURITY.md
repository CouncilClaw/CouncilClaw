# Security Policy

## Reporting a Vulnerability
Please do not open public issues for security vulnerabilities.
Email the maintainer privately at **elishaodida@proton.me** with:
- impact
- steps to reproduce
- affected versions/commits

## Current Security Controls
- Command execution is allowlist-based (`ALLOWED_SHELL_COMMANDS`)
- Command chaining is blocked (`&&`, `|`, `;`)
- Chairman model override is allowlist-gated
- Model calls use retry/backoff controls

## Hardening Roadmap
- webhook auth token enforcement
- request rate limiting
- signed webhook verification
- stricter output validation before execution
