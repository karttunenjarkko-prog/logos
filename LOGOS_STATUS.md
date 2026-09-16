# 🧠 LOGOS - Project Master Status

## 📜 Vision & Philosophy
Logos is a "Thinking Operating System", not a chatbot[cite: 2]. Its purpose is to develop the user's thinking quality through Socratic questioning and assumption-challenging[cite: 2].
- **Anti-Goal:** Do not provide ready-made answers, summaries, or "next actions" that rob the user of the thinking process[cite: 2].
- **Core Principle:** "One growth area at a time"[cite: 1].

## 🎯 Current Milestone: Phase C1 - Mobile Capture Dogfood
The immediate goal is to verify that Logos becomes useful when raw thoughts can be captured on an Android phone in seconds. Test the real walking flow on Asus Zenfone 10 with Shokz OpenRun Pro before adding heavier native integrations. SPARRI quality remains the next engine milestone after the capture habit is validated.

## ✅ Recent Changes & Audit Results
- **Migration:** Project moved to GitHub for streamlined development.
- **Audit (logos_audit.md):** Identified that current schemas force Logos into a "consultant report" style[cite: 2].
- **Strategy Shift:** Decided to avoid over-engineering `storage.v2` for now. Focus is 100% on the response logic[cite: 2].
- **Agent Governance:** Added `AGENTS.md` and `CLAUDE.md` so AI agents know to read this file first, preserve the Logos philosophy, verify changes, and push successful updates to GitHub.
- **SPARRI v1:** Implemented a SPARRI-specific Challenge Engine with strict assumption/challenge output and separate rendering.
- **Manifesto & Audit Harness:** Added `README.md`, a SPARRI golden set, and a lightweight validation script for SPARRI output structure and anti-advice rules.
- **Capture v1:** Added raw thought capture with text/voice source metadata, localStorage persistence, newest-first list, and a "Sparraa tästä" handoff into SPARRI chat without AI processing during capture.
- **Capture MVP:** Made Capture the default entry view and extended voice capture into a hands-free flow with a live transcript, automatic listening continuation, and Finnish stop commands ("tallenna", "lopeta", "siinä kaikki").
- **Mobile HTTPS Release:** Published the installable Capture MVP at `https://karttunenjarkko-prog.github.io/logos/` for Android testing. The GitHub repository is temporarily public because the current GitHub plan does not support Pages for private repositories.
- **Voice Transcript Fix:** Replaced append-based Web Speech result handling with index-based final/interim tracking so Android Chrome cannot duplicate previously returned recognition results across updates or automatic restarts.

## 🛠 In Progress (The "Next Move")
- [x] **Implement SPARRI_CHALLENGE_SCHEMA:** Refactor `logosEngine.js` to use a strict schema that forces the detection of one assumption and one sharp question[cite: 2].
- [x] **Sycophancy Filter:** Update system prompts to forbid agreeable openers like "Great idea" or "I understand"[cite: 2].
- [x] **SPARRI Golden Set:** Add at least 10 representative SPARRI inputs covering vague emotion, responsibility shifting, fast conclusions, decision avoidance, mind-reading, false dichotomy, catastrophizing, vague authority, hidden norms, and motivation assumptions.
- [x] **Lightweight Validation Script:** Add offline checks for schema shape, banned sycophancy, banned advice phrases, one question mark, and optional 0-8 manual scoring.
- [ ] **SPARRI Quality Audit:** Test the golden set with real OpenAI outputs and tune the prompt until at least 8/10 responses score 7/8 or higher.
- [ ] **Android Capture Field Test:** Install Logos on the Zenfone 10, allow microphone access, and test the Shokz → Gemini → Logos capture flow during a real walk.
- [ ] **Hosting & Privacy Decision:** Reassess the temporary public GitHub Pages setup before broader use or storing sensitive thoughts beyond local browser storage.

## 📝 Developer Notes for AI
1. **Response Logic:** When in SPARRI mode, Logos must not summarize. It must only identify an assumption and ask one question[cite: 2].
2. **Context Injection:** Future iterations will feed `cognitive_signals` (e.g., false dichotomies) from memory back into the engine[cite: 2].
3. **Lean Build:** Keep UI changes minimal; the value is in the `logosEngine.js` output quality.
