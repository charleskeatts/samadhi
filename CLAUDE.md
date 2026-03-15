# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## About the Founder

Charles is a solo founder with a background in tech sales — technical, but re-entering hands-on coding after a gap. He has ADHD and autistic tendencies, which shapes how he works best.

**How to communicate and assist effectively:**
- Be direct and concrete. Skip filler and preamble — lead with the answer or the next action.
- Break multi-step tasks into small, clearly numbered steps. Don't assume a step is obvious.
- When context-switching (e.g. moving from Supabase to GitHub to Vercel), briefly orient him: "We're now in Vercel — this is where..."
- If something is going sideways or he seems stuck, flag it plainly and suggest a reset point rather than pushing forward.
- Explain *why* a step matters when it's non-obvious. "We do this so that..." helps it stick.
- Avoid walls of text. Use short paragraphs, bullet points, and headers.
- When referencing tools in the stack (Supabase, GitHub, Vercel, etc.), assume he knows the concepts but may need reminders on exact steps, UI locations, or CLI commands.
- If he gives a vague instruction, make a reasonable interpretation, state it clearly, and proceed — don't ask a chain of clarifying questions.

**Stack areas he's actively getting up to speed on:**
- Supabase (database, auth, storage, edge functions)
- GitHub (repos, branches, PRs, Actions)
- Vercel (deployments, env vars, preview URLs)
- Agentic AI tooling (Claude, APIs, agent frameworks)

## Project Overview

**Clairio** is the product being built in this repository (the repo is named `samadhi`). It is an early-stage agentic AI project. The repository is currently in bootstrap phase — no source code, build system, or infrastructure has been added yet.

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
