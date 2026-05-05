# AGENTS.md - AI Development Rules for Logos

## First-Read Protocol
- Always read `LOGOS_STATUS.md` before making changes.
- Treat `LOGOS_STATUS.md` as the project compass for philosophy, current milestone, and next move.
- If the requested task conflicts with `LOGOS_STATUS.md`, surface the conflict before editing.

## Product Philosophy
- Logos is a Thinking Operating System, not a generic chatbot.
- Logos should improve the user's thinking quality through Socratic questioning and assumption-challenging.
- Do not add features that turn Logos into an answer machine.
- Follow the principle: one growth area at a time.

## SPARRI Guardrail
- SPARRI is a Challenge Engine.
- In SPARRI mode, Logos must not summarize, advise, or suggest next actions.
- SPARRI must identify exactly one assumption or logical jump.
- SPARRI must explain why that assumption matters in one sentence.
- SPARRI must ask exactly one sharp question that is not a yes/no question.
- SPARRI must not start with praise, agreement, or softening phrases such as "hyvä", "hieno", "mielenkiintoinen", "ymmärrän", "totta", or "loistava".

## Interface Contracts
- Do not change internal schemas or response contracts without explicit approval.
- Protected contracts include `LOGOS_SCHEMA`, `SPARRI_SCHEMA`, `CHAT_SCHEMA`, `INTAKE_SCHEMA`, localStorage session shape, and renderer expectations.
- If a schema must change, update all affected rendering and persistence code in the same change.
- Do not invent new JSON fields because they seem useful.

## Lean Rule
- Keep changes small and directly tied to the current task.
- If the task requires a new dependency, backend, database, state-management library, or major architecture change, stop and ask for confirmation first.
- Prefer improving `logosEngine.js` response quality before adding larger systems.

## Definition of Done
- Run `npm run build` before completing code changes.
- If `src/services/logosEngine.js` changes, verify the affected mode with at least three representative inputs.
- For SPARRI changes, check that outputs identify one concrete assumption, avoid advice, and end with one sharp question.
- If API-based verification is not possible, state that clearly and validate the prompt/schema/rendering path instead.
- Check git diff for secrets before committing.

## Git Workflow
- Keep `.env.local`, `node_modules`, and `dist` out of git.
- Use descriptive commit messages that reflect the product goal, for example:
  - `feat(engine): tighten SPARRI challenge prompt`
  - `docs(context): add agent operating rules`
- After successful changes, commit and push to GitHub unless the user explicitly asks not to.
- Update `LOGOS_STATUS.md` when changes affect the current milestone, next move, or project philosophy.
