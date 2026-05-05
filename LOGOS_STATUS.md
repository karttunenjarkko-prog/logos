# LOGOS — Project Master Status

## Vision & Philosophy

The full doctrine lives in [DOCTRINE.md](./DOCTRINE.md). In short:

- Logos is a Thinking Operating System, not a chatbot.
- Its purpose is to develop the user's thinking quality through Socratic
  questioning and assumption-challenging.
- **Anti-goal:** do not provide ready-made answers, summaries, or
  next-actions that rob the user of the thinking process.
- **Core principle:** one growth area at a time.

## Current Milestone: Phase L2 — The Challenge Engine

The immediate goal is to keep SPARRI as a cognitively demanding resistance
engine and to bring the rest of the modes in line with the doctrine.

## Recent Changes & Audit Results

- **Migration:** project moved to GitHub for streamlined development.
- **Audit (`logos_audit.md`):** identified that current schemas force Logos
  into a "consultant report" style.
- **Strategy shift:** decided to avoid over-engineering `storage.v2` for
  now. Focus is 100% on response logic.
- **Agent governance:** added `AGENTS.md` and `CLAUDE.md` so AI agents read
  the doctrine first, preserve the philosophy, verify changes, and push
  successful updates to GitHub.
- **SPARRI v1:** implemented a SPARRI-specific Challenge Engine with strict
  assumption/challenge output and separate rendering.
- **Manifesto & audit harness:** added `README.md`, a SPARRI golden set,
  and a lightweight validation script for SPARRI output structure and
  anti-advice rules.
- **Doctrine consolidation:** added `DOCTRINE.md` as single source of
  truth and `src/services/doctrine.js` as a single source for hard
  invariants (banned openers, banned advice, yes/no openers, mode enum,
  SPARRI output keys). Engine and validator now import from one place.

## In Progress (The Next Move)

- [x] Implement `SPARRI_CHALLENGE_SCHEMA`: refactor `logosEngine.js` to use
  a strict schema that forces detection of one assumption and one sharp
  question.
- [x] Sycophancy filter: update system prompts to forbid agreeable openers.
- [x] SPARRI golden set: at least 10 representative SPARRI inputs covering
  vague emotion, responsibility shifting, fast conclusions, decision
  avoidance, mind-reading, false dichotomy, catastrophizing, vague
  authority, hidden norms, and motivation assumptions.
- [x] Lightweight validation script: offline checks for schema shape,
  banned sycophancy, banned advice phrases, one question mark, optional
  0–8 manual scoring.
- [x] Doctrine consolidation: `DOCTRINE.md` + `src/services/doctrine.js`
  as single sources of truth for philosophy and hard invariants.
- [x] SPARRI runner script: `scripts/run-sparri-golden.mjs` feeds the
  golden set through OpenAI and writes `tests/sparri/results.json`. SPARRI
  prompt + schema + normalization extracted to `src/services/sparri.js`
  so the engine and the runner share one definition.
- [ ] **SPARRI Quality Audit:** run `npm run sparri:run`, then
  `npm run validate:sparri -- tests/sparri/results.json`, then score the
  outputs manually until at least 8/10 score 7/8 or higher. Tune the
  SPARRI prompt in `src/services/sparri.js` until the target is met.
- [ ] **Mode migration:** rename fourth mode `taito` → `kehitys` per
  DOCTRINE §6. Schema change — requires explicit approval before edits.

## Developer Notes for AI

1. **Doctrine first.** Read `DOCTRINE.md` before changing prompts, schemas,
   or copy.
2. **Single source of invariants.** Banned word lists and the mode enum
   live in `src/services/doctrine.js`. Import from there; do not duplicate.
3. **Response logic.** When in SPARRI mode, Logos must not summarize. It
   must only identify an assumption and ask one question.
4. **Context injection.** Future iterations will feed `cognitive_signals`
   (e.g., false dichotomies) from memory back into the engine.
5. **Lean build.** Keep UI changes minimal; the value is in the
   `logosEngine.js` output quality.
