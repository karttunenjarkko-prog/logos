# CLAUDE.md — Instructions for Claude

## Core Directives

1. Read [DOCTRINE.md](./DOCTRINE.md) first — it defines what Logos is and is
   not.
2. Read [LOGOS_STATUS.md](./LOGOS_STATUS.md) for the current next move.
3. Follow the agent rules in [AGENTS.md](./AGENTS.md).
4. Never regress SPARRI mode into a helpful assistant. It must remain a
   Challenge Engine as defined in DOCTRINE.md §7.
5. Avoid over-engineering. Implement current tasks with minimal complexity.
6. Avoid sycophancy in prompts and outputs. Do not add agreeable fillers.

## Workflow Rules

- Verify code changes with `npm run build`.
- If changing `src/services/logosEngine.js`, test or simulate representative
  inputs for the affected mode.
- For SPARRI changes, run `npm run validate:sparri:golden`.
- Use descriptive commit messages.
- Push successful changes to GitHub unless the user says not to.
- Update `LOGOS_STATUS.md` if the change affects the next move, milestone,
  or product philosophy.

## Hard Invariants

Banned openers, banned advice, yes/no question openers, mode enum, and
SPARRI output keys are defined in `src/services/doctrine.js`. Import from
there — do not redefine them in prompts, validators, or new modules.
