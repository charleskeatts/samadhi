# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## Project Overview

**samadhi** is an early-stage project focused on agentic AI. The repository is currently in bootstrap phase — no source code, build system, or infrastructure has been added yet.

## Repository State

As of March 2026, the repository contains:
- `README.md` — minimal project description
- `CLAUDE.md` — this file

When code is added, update this file to reflect the actual structure, stack, and conventions.

## Development Branch

All AI-assisted development should happen on branches prefixed with `claude/`. The branch name must match the session ID suffix used during the session (e.g. `claude/add-claude-documentation-4cv5R`). Never push directly to `main` or `master`.

## Git Conventions

- Commit messages should be clear and imperative: `Add X`, `Fix Y`, `Refactor Z`
- Keep commits focused — one logical change per commit
- Always push with `-u`: `git push -u origin <branch-name>`
- Branch from `main` for all new work

## General AI Assistant Guidelines

### Do
- Read existing files before modifying them
- Keep changes minimal and focused on what was requested
- Use the simplest solution that satisfies the requirement
- Update this CLAUDE.md whenever the project structure meaningfully changes

### Don't
- Add unrequested features, abstractions, or refactors
- Add comments or docstrings to code you didn't change
- Create files unless strictly necessary
- Introduce security vulnerabilities (XSS, SQL injection, command injection, etc.)
- Push to `main`/`master` directly

## Tech Stack

Not yet determined. Update this section once a language, framework, and build system are chosen.

## Project Structure

Not yet established. Update this section once source directories and conventions are in place. Likely candidates given the "agentic ai" intent:

- `src/` or `app/` — primary source code
- `tests/` — test files
- `.github/workflows/` — CI/CD

## Testing

No test infrastructure exists yet. When added, document the test command here (e.g. `npm test`, `pytest`, `cargo test`).

## Environment Setup

No environment variables or configuration files exist yet. When added, document required env vars here and add an `.env.example`.
