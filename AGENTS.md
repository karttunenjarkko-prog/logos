# AGENTS.md — AI Development Rules for Logos

The product doctrine — philosophy, anti-goals, modes, SPARRI rules — lives
in [DOCTRINE.md](./DOCTRINE.md). Read it first. This file covers operating
rules for AI agents working on the codebase.

## First-Read Protocol

1. [DOCTRINE.md](./DOCTRINE.md) — product doctrine and hard invariants
2. [LOGOS_STATUS.md](./LOGOS_STATUS.md) — current milestone and next move
3. This file — agent operating rules

If a requested task conflicts with the doctrine or the current next move,
surface the conflict before editing.

## Single Source of Truth for Invariants

Hard invariants (banned openers, banned advice, yes/no question openers,
mode enum, SPARRI output keys) live in `src/services/doctrine.js`. Both the
engine and the validation tooling import from there. Do not duplicate these
lists in prompts, validators, or documentation.

## Interface Contracts

Do not change internal schemas or response contracts without explicit
approval. Protected contracts include `LOGOS_SCHEMA`, `SPARRI_SCHEMA`,
`CHAT_SCHEMA`, `INTAKE_SCHEMA`, localStorage session shape, and renderer
expectations. If a schema must change, update all affected rendering and
persistence code in the same change. Do not invent new JSON fields because
they seem useful.

## Lean Rule

Keep changes small and directly tied to the current task. If the task
requires a new dependency, backend, database, state-management library, or
major architecture change, stop and ask for confirmation first. Prefer
improving `logosEngine.js` response quality before adding larger systems.

## Definition of Done

- Run `npm run build` before completing code changes.
- If `src/services/logosEngine.js` changes, verify the affected mode with at
  least three representative inputs.
- For SPARRI changes, run `npm run validate:sparri:golden` and check that
  outputs identify one concrete assumption, avoid advice, and end with one
  sharp question.
- If API-based verification is not possible, state that clearly and
  validate the prompt/schema/rendering path instead.
- Check git diff for secrets before committing.

## Git Workflow

- Keep `.env.local`, `node_modules`, and `dist` out of git.
- Use descriptive commit messages that reflect the product goal, for example:
  - `feat(engine): tighten SPARRI challenge prompt`
  - `docs(doctrine): consolidate invariants into single source`
- After successful changes, commit and push to GitHub unless the user
  explicitly asks not to.
- Update `LOGOS_STATUS.md` when changes affect the current milestone, next
  move, or product philosophy.
