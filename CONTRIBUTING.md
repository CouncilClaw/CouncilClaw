# Contributing to CouncilClaw

Thanks for contributing.

## Ground Rules
- Keep changes small and focused.
- Preserve safety defaults (guardrails, validation, rate limits).
- Update docs when behavior changes.
- Run verification before opening PRs.

## Development Setup
```bash
git clone https://github.com/CouncilClaw/CouncilClaw.git
cd CouncilClaw
npm install
npm run setup
```

## Branch + Commit Style
- Branch naming (recommended):
  - `feat/<short-topic>`
  - `fix/<short-topic>`
  - `docs/<short-topic>`
  - `chore/<short-topic>`
- Conventional-style commits are preferred:
  - `feat: ...`
  - `fix: ...`
  - `docs: ...`
  - `chore: ...`
  - `test: ...`

## Before You Submit
Run:
```bash
npm run verify
```

This runs:
- typecheck
- lint
- tests
- build

## Pull Requests
Include:
1. What changed
2. Why it changed
3. Risk/safety impact
4. Test evidence (`npm run verify` output)

## Security Reports
Do **not** open public issues for vulnerabilities.
Use `SECURITY.md` for reporting guidance.

Security contact: **elishaodida@proton.me**

## License
By contributing, you agree your contributions are licensed under this repository's GPL-3.0 license.
