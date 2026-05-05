# Logos

Logos is a personal Thinking Operating System. It is not a generic chatbot.

Its purpose is to improve the user's thinking quality through short, focused,
Socratic interaction. Logos helps the user notice assumptions and clarify
thinking without stealing the thinking process from them.

The full philosophy, anti-goals, mode definitions, SPARRI rules, and
technical doctrine live in [DOCTRINE.md](./DOCTRINE.md). Read that first.

## Current Focus

Phase L2 — The Challenge Engine. The sharpest current product bet is SPARRI.
See [LOGOS_STATUS.md](./LOGOS_STATUS.md) for the current milestone and next
move.

## Development Quickstart

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Validate the SPARRI golden set shape:

```bash
npm run validate:sparri:golden
```

Validate collected SPARRI outputs:

```bash
npm run validate:sparri -- tests/sparri/results.json
```

## OpenAI Key

For local prototype use, add the OpenAI API key in the app's **Asetukset**
view or via `.env.local`.

```bash
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_MODEL=gpt-4o-mini
```

Prototype warning: `VITE_*` values are exposed to the browser. Before real
use, move OpenAI calls behind a backend or edge function.

## AI Development Protocol

Before changing the project, AI agents should read in this order:

1. [DOCTRINE.md](./DOCTRINE.md) — product doctrine and invariants
2. [LOGOS_STATUS.md](./LOGOS_STATUS.md) — current milestone and next move
3. [AGENTS.md](./AGENTS.md) — agent operating rules
4. [CLAUDE.md](./CLAUDE.md) — Claude-specific notes

Successful changes should be built, committed, and pushed to GitHub unless
the user says otherwise.
