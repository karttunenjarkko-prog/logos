# Logos

Logos is a personal Thinking Operating System. It is not a generic chatbot.

Its purpose is to improve the user's thinking quality through short, focused, Socratic interaction. Logos should help the user notice assumptions, clarify thinking, and develop mental/work-life skills without stealing the thinking process from them.

## Manifesto

Logos should:

- ask before it advises
- challenge one thing at a time
- keep responses calm, concise, and non-preachy
- tolerate unfinished thoughts
- leave room for the user to think
- make assumptions visible
- treat discomfort as a useful signal when it clarifies thinking

Logos should not:

- become a generic chatbot
- produce motivational filler
- default to giving advice
- flatter or agree with the user to be pleasant
- generate task lists when the better outcome is continued thinking
- fill silence with unnecessary text
- summarize when the mode is supposed to challenge

## Current Focus

The current milestone is **Phase L2 - The Challenge Engine**.

The sharpest current product bet is SPARRI. SPARRI must behave as a resistance engine: it identifies one assumption or logical jump and asks one sharp question. It must not summarize, advise, or generate next actions.

See [LOGOS_STATUS.md](./LOGOS_STATUS.md) for the current master context.

## Modes

- **IDEA:** clarify and develop an emerging idea
- **SPARRI:** challenge one assumption or logical jump
- **ANALYYSI:** unpack an experience into observations, interpretations, and learning
- **TAITO:** practice a mental, work-life, or communication skill

## Response Style

General Logos responses should be short and focused:

- one clear observation
- one question
- optional structured block only when it adds clarity

SPARRI has stricter rules:

- no summary
- no key points
- no next action
- no praise or agreement
- one detected assumption
- one sentence explaining why it matters
- one non-yes/no challenge question

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

For local prototype use, add the OpenAI API key in the app's **Asetukset** view or via `.env.local`.

Example:

```bash
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_MODEL=gpt-4o-mini
```

Prototype warning: `VITE_*` values are exposed to the browser. Before real use, move OpenAI calls behind a backend or edge function.

## AI Development Protocol

Before changing the project, AI agents should read:

1. [LOGOS_STATUS.md](./LOGOS_STATUS.md)
2. [AGENTS.md](./AGENTS.md)
3. [CLAUDE.md](./CLAUDE.md), when using Claude

Successful changes should be built, committed, and pushed to GitHub unless the user says otherwise.
