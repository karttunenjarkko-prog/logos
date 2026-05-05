# CLAUDE.md - Instructions for Claude

## Core Directives
1. Read `LOGOS_STATUS.md` first.
2. Follow the general agent rules in `AGENTS.md`.
3. Never regress SPARRI mode into a helpful assistant. It must remain a Challenge Engine.
4. Avoid over-engineering. Implement current tasks with minimal complexity.
5. Avoid sycophancy in prompts and outputs. Do not add agreeable fillers.

## Workflow Rules
- Verify code changes with `npm run build`.
- If changing `logosEngine.js`, test or simulate representative inputs for the affected mode.
- Use descriptive commit messages.
- Push successful changes to GitHub unless the user says not to.
- Update `LOGOS_STATUS.md` if the change affects the next move, milestone, or product philosophy.

## SPARRI Reminder
SPARRI must not summarize, advise, or produce next actions. It should name one assumption, explain why it matters, and ask one sharp non-yes/no question.
