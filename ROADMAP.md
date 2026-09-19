# 华語 Huayu — Deep Audit & Expansion Roadmap

> How to take Huayu from a feature-rich toy to an **effective, retention-driven Mandarin learning platform**.
> Method: deep codebase audit (48 files) + web research on spaced-repetition science, second-language acquisition, Mandarin pedagogy, EdTech gamification, and competitor tools (Duolingo, Skritter, Pleco, Anki/FSRS).

---

## 0. TL;DR — the 10 moves that matter most

1. **Make the streak real.** It's hardcoded to `7` in `src/App.tsx` today. Streaks are the #1 retention lever in Duolingo-style apps — but only when they're *earned* and at-risk.
2. **Make "SRS" actually spaced.** `src/components/SrsFlashcards.tsx` cycles cards in order and forgets everything on refresh. Wire a real scheduler (SM-2/FSRS-style) + a persistent store.
3. **Build the learning loop.** Learn → practice → review → test → SRS. Today there is no unified progress model (`UserProgress` in `src/types.ts` is dead code), no XP/level, no revision queue, no mastery.
4. **Give every skill one shared spine.** Characters/words/sentences should flow across Writing–Listening–Speaking–Reading through a single **item bank + review queue** instead of 8 independent localStorage silos.
5. **Fix sound everywhere.** TTS/STT depends on Chromium-only, deprecated Web Speech APIs. Build a robust cross-browser audio engine (server AI audio with graceful fallback).
6. **Ship a guided HSK 1–6 path.** Users don't know what to practice next. Add placement, a curriculum graph, and daily goals tied to the routine card.
7. **Double down on comprehensible input.** Tap-to-translate graded readers + sentence mining → SRS is the highest-leverage feature for real acquisition.
8. **Make the speaking tutor voice-native & streaming.** The AI chat is text-only; feeding the learner's recorded audio (Gemini audio-input) turns it into a real conversation partner.
9. **Fix the single 664 kB JS chunk.** Lazy-load the big skill components; bundle stroke data offline so the app works without the hanzi-writer-data CDN.
10. **Instrument everything, then tune.** No analytics = flying blind. Add a lightweight event log + a progress dashboard so you can see drop-off and improve.

---

## 1. Method & Sources

**Codebase audit (this repo, 48 files):** architecture, data model, every component surface, persistence layer, server endpoints, build config.

**Web research used to shape recommendations:**
- **Spaced repetition** — Wikipedia (Ebbinghaus forgetting curve, Leitner system, SM-2/SM-5, evidence) & FSRS (open-spaced-repetition; modern default target retention 90%)
- **Second-language acquisition** — Wikipedia (Krashen input hypothesis / *i+1*, Swain output hypothesis, interaction hypothesis)
- **Web Speech API** — MDN (SpeechRecognition non-standard/deprecated; `speechSynthesis`/`SpeechSynthesisUtterance` are Chromium-only)
- **Duolingo** — Wikipedia (learning model, gamification, half-life-regression SRS, streaks, A/B testing culture, criticisms)
- **Hacking Chinese** (Olle Linge) — Mandarin-specific pedagogy, SRS & habit-building advice
- **Skritter** — skritter.com (character-writing SRS, stroke-level grading, list-based learning)
- **Gamification** — Wikipedia (techniques, effectiveness research, "pointsification" critique)

---

## 2. Deep Audit

### 2.1 What is already genuinely strong (protect this)

| Area | Evidence |
|---|---|
| **Four-skill depth** | 25+ tools: Hanzi canvas + stroke order, 永 principles, radical decomposition, tingxié dictation, Tian-Zi-Gé worksheets, tone ear trainer, pitch contours, speed-ramped listening, minimal pairs, tone-sandhi lab, pinyin soundboard, pronunciation clinic, shadowing player, pitch comparator, tongue twisters, AI chat tutor, graded readers, grammar unscrambler, custom lesson creator, SRS flashcards UI, Chengyu masterclass, trouble/leech notebook with Anki CSV export |
| **AI + resilience** | `server.ts` calls Gemini with a 3-model fallback cascade; every AI path degrades to `src/server/offlineChineseAnalyzer.ts` (precomputed token/character analyses) → the app works with **zero API key** |
| **Design system** | Token-based theming (recent redesign): all colors/fonts/radii switch via CSS variables; 4 themes; font scaling; printable worksheets |
| **Novel learning aids** | Tone oscillator (Web Audio) for pure F0 contours; live pitch comparator; syllable heatmaps in shadowing; self-graded dictation |
| **Data discipline** | `src/data/*` is fully typed (`CharacterData`, `ToneQuestion`, …); stroke data has offline precache + CDN fallback |
| **Anki interop** | Trouble list exports Anki-compatible TSV/CSV |

### 2.2 Critical findings — ranked by impact

| # | Finding | Where | Why it hurts "effectiveness" |
|---|---|---|---|
| 🔴 1 | **Streak is hardcoded** | `App.tsx:17` → `streakDays = useState(7)`; `setStreakDays` is never called | Users see a fake metric. Streaks drive retention only when *earned* and *at-risk* ("come back or lose your streak") |
| 🔴 2 | **"SRS" has no scheduling** | `SrsFlashcards.tsx` advances `currentIndex++`; the 4 rating buttons don't change intervals; `reviewCount` is in-memory only | The #1 learning-science feature (spaced repetition) is a demo. `SrsFlashcard {interval, repetition, easeFactor, dueDate}` in `types.ts` is defined but **unused** |
| 🔴 3 | **No unified progress model** | `UserProgress` in `types.ts` is dead code; mastery = a star toggle (`WritingSkill.handleToggleFavorite`); no XP, no level, no known-word ledger | Nothing aggregates "what do I know?" → no personalization, no dashboard, no motivation |
| 🔴 4 | **Scores are dropped** | `ListeningSkill.onScoreUpdate` is never passed by `App.tsx` | Listening results vanish after the session |
| 🟠 5 | **Audio is Chrome/Edge-only** | `src/utils/audio.ts` uses `window.speechSynthesis` / `SpeechSynthesisUtterance`; STT uses `SpeechRecognition` / `webkitSpeechRecognition` (deprecated, non-standard per MDN) | On Firefox/Safari/most phones: no TTS and no speech evaluation → Speaking is broken off-Chrome |
| 🟠 6 | **Tiny content corpus** | `chineseData.ts` + `expanded*` files: a few dozen characters with stroke data, a handful of graded stories & audio phrases — nowhere near HSK coverage (HSK4 alone ≈ 1200 words) | Users exhaust content fast; no long-term path |
| 🟠 7 | **One 664 kB JS chunk** | `bun run build` warns `>500 kB`; all 25+ tools eager-loaded | Slow first paint; every tab pays for all the others |
| 🟠 8 | **localStorage sprawl, no backup** | 8+ ad-hoc keys (`huayu_daily_…`, `huayu_leech_list`, `huayu_custom_stories`, `huayu_mastered`, …) | No schema/version/migration; clearing one key loses data; no export-all; no cross-device |
| 🟡 9 | **No onboarding or placement** | Fresh users land on 覆 (an HSK-6 character) with no "start here" | Beginners bounce; no adaptive starting point |
| 🟡 10 | **AI chat is text-only & non-streaming** | `SpeakingSkill` → `POST /api/conversation/chat`, response arrives as one blob | Feels slow/lifeless vs. streaming chat; no voice in/out |
| 🟡 11 | **Server hardening** | `server.ts`: no rate limiting, auth, caching, or telemetry on AI endpoints | Cost/abuse risk if ever made public/multi-user |
| 🟡 12 | **a11y & i18n partial** | Modal lacks focus-trap & Escape-close; some controls unlabeled; UI copy is an EN/中文 mix with no localization layer | Excludes screen-reader users & non-English learners |
| 🟢 13 | **Script converter is tiny** | `src/utils/scriptConverter.ts` hand-maps ~70 char pairs; polyphone ambiguity unresolved (发→發/髮); stroke data not script-mapped | Traditional mode shows wrong forms for many words |

### 2.3 Hard facts (verified in code)

- `streakDays` default = `7`; **0 call sites** for `setStreakDays`.
- `UserProgress` and `SrsFlashcard` are defined in `types.ts` but referenced **nowhere else**.
- `App.tsx` wires `onCharacterMastered` to Writing only; Listening's `onScoreUpdate` and SRS's `onMasteredChange` are **not connected**.
- Build emits `dist/assets/index-*.js` at **663.90 kB** (gzip 199 kB) with a chunk-size warning.
- Stroke glyphs fetch at runtime from `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/<char>.json` (partial precache only) → offline-unfriendly, per-character latency.
- Five server endpoints exist: `/api/health`, `/api/conversation/chat`, `/api/speech/feedback`, `/api/character/analyze`, `/api/text/analyze` — all AI-backed with offline fallback.
- `DailyFourSkillsRoutine` already persists per-day completions under `huayu_daily_<date>` — a ready-made seed for a real streak engine.

---

## 3. What the research says — how to make learning actually stick

### 3.1 Spaced repetition (Ebbinghaus → Leitner → SM-2 → FSRS)

- **The forgetting curve is real**: without review, retention decays exponentially. Reviewing *just before* forgetting flattens the curve.
- **Leitner/SM-2** (Anki's classic): intervals grow ~2.5× per success (1, 2, 6, 15, 30 days…) and reset on lapse. Simple, proven, easy to implement.
- **FSRS** (modern): a stochastic model of **stability + retrievability**. Default desired retention = **0.90**; intervals adapt per card history; lapses handled explicitly. *Practical defaults: new cards = 10–20/day, learning steps ≈ 1 min/10 min, graduating interval ≈ 1 day, max interval ≈ 2–4 years, retention 0.85–0.90.*
- Rule of thumb for language apps: **fail → same day again; again/hard/good/easy → 1 min / 1 d / 3 d / 7 d** as a starting ladder; tune with real data.
- **Huayu implication**: stop faking it. Implement a scheduler with the card buttons already on screen (`Again / Hard / Good / Easy`), persist `dueDate`, and surface a daily "Reviews due" queue.

### 3.2 Second-language acquisition theory (design north-star)

| Principle | Meaning for Huayu |
|---|---|
| **Comprehensible input (i+1)** | Give learners content *just above* their level — the graded readers & speed-ramped listening already point here; add placement + adaptive text difficulty |
| **Output hypothesis** | Speaking & writing must be *pushed*, not just recognition quizzes — keep shadowing, dictation, and free-write practice first-class |
| **Interaction** | Conversational + feedback loops are optimal — the AI chat is a seed; make it voice-based and scenario-gated |
| **Implicit + explicit balance** | Drill (tones, pinyin, strokes) *and* meaning-focused input; explicit grammar tips *after* an attempt, not before |
| **Motivation** | Autonomy (choose daily goal), competence (visible progress), relatedness (streaks, maybe social) |

### 3.3 Mandarin-specific pedagogy (Hacking Chinese et al.)

- **Tones are a handling skill**: train discrimination *and* production from day one, embedded in words (tone pairs), not isolated syllables. Huayu's tone tools are ahead of most apps — integrate them into every other skill.
- **Characters ≠ words**: learners need HANZI recognition → production (writing) in stages; radicals/components as the memory hook (already in RadicalDecompositionExplorer); SRS per character *and* per word.
- **Balance all four skills but sequence them**: massive listening before heavy output; reading follows listening; writing last but rewarding.
- **Habit > motivation**: small daily goals (e.g., 5 new words + 20 reviews), streaks with a free-skip/streak-saver option, and a visible "today" plan (the Daily Routine card is the perfect hook).
- **Words, not lists**: teach within sentences & stories; sentence mining → SRS is the Pleco/Skritter winning pattern.

### 3.4 Gamification — what works and what backfires (Duolingo + research)

**Works (retention-verified):**
- **Streaks with stakes** — visible, at-risk, and tied to *a tiny real cost* (streak-saver/repair) — Duolingo's most-copied mechanism.
- **XP as a short-cycle reward** with steady drip and occasional "double XP"; **progress bars & daily quests** (Huayu's Daily Routine is a natural quest board).
- **Small, frequent, low-cost wins** (confetti, sounds) — already in Huayu, keep them.
- **Feedback speed** — instant correctness + explanation beats points.
- **Achievements** work best as *milestones of real evidence* ("120-day streak", "500 cards due-on-time") rather than arbitrary badges.

**Backfires (avoid):**
- **Pointsification** — slapping points on everything without meaning creates engagement theater.
- **Harsh failure states** (losing all progress) → anxiety churn.
- **Leaderboards for non-competitive audiences** — make social optional/private.
- **Fake stats** (the current hardcoded streak) — destroys trust; users *will* notice.

### 3.5 Competitor matrix → what to adopt

| Tool | Core strength | Adopt into Huayu |
|---|---|---|
| **Duolingo** | Guided path, streaks, mastery per unit, half-life SRS, A/B-tested psychology | Curriculum graph (`Learn → Practice → Review → Test`), unit mastery, streak engine, daily goals |
| **Anki / FSRS** | Gold-standard SRS; review *queue* with due counts; retention target tuning | Real scheduler + "X due today" queue + FSRS-style retention stats |
| **Skritter** | Writing-based SRS with **stroke-level grading**, list-driven learning | Grade freehand strokes by comparing drawn path vs. target; reconnect SRS to the canvas |
| **Pleco** | Tap-to-translate reader, sentence lookup, OCR, bundled dictionary, SRS out of any look-up | **Tap-to-translate in all readers**, save-to-SRS button on every word/phrase, AI/OFFLINE dict in one place |
| **Hacking Chinese / input-first tools** | Content-first: podcasts, readers at speed 0.8×, shadowing, i+1 lists | Audio-first reading/listening pipeline, sentence banks, shadowing for input |

**Huayu's unique wedge (defend it):** the *only* tool in this set that is natively **four-skills + AI + offline-resilient** in one web app — tones-through-writing is a genuinely differentiated identity once the SRS spine and voice-native AI tutor land.

---

## 4. The Expansion Roadmap

Sequenced so each phase delivers value, de-risks the next, and stays shippable.

### Phase 0 — Foundations & trust (fix what's broken first) · 1–2 weeks

1. **Unified progress store (`src/utils/progressStore.ts`)**
   - One versioned, namespaced JSON under a single localStorage key (+ Web Storage quota guard), with a `SCHEMA_VERSION` and migrations.
   - Consolidate today's keys: `huayu_mastered`, `huayu_daily_*`, `huayu_leech_list`, `huayu_custom_stories`, `huayu_theme_preset`, `huayu_font_scale`, `huayu_script_mode`.
   - Add `exportAll()/importAll()` (JSON) + keep Anki CSV export.
2. **Real streak engine (`src/utils/streaks.ts`)**
   - Compute `streakDays` from the activity log (`DailyFourSkillsRoutine` already logs daily completion). Add: streak freeze/repair, "at risk" UI in Header, and **stop lying** (remove hardcoded 7).
3. **Real SRS scheduler (`src/utils/srs.ts`) — connect what exists**
   - Implement SM-2 (or FSRS-lite) over `SrsFlashcard` (`interval`, `repetition`, `easeFactor`, `dueDate`).
   - `SrsFlashcards.tsx`: persist queue, order by `dueDate`, update interval on `Again/Hard/Good/Easy`, show "X due today".
   - Let every skill write into the same queue: characters, words, tone pairs, sentences (from Reading/Listening/TroubleList).
4. **Wire up dropped signals**
   - Pass `onScoreUpdate` to `ListeningSkill`; pass `onMasteredChange` to `SrsFlashcards`; log every scored event to the activity log.
5. **Split the giant JS chunk**
   - `React.lazy` the four skill modules + heavy sub-tools (WritingSkill, grammar, pitch tools) so the home view loads lean.
6. **Cross-browser audio layer (`src/utils/audio.ts` v2)**
   - Router: (a) browser TTS if available; (b) server AI TTS (stream mp3/wav) otherwise; (c) silent graceful fallback with a "Sound unavailable" chip.
   - Same for STT: keep Chromium path, but route through `/api/speech/feedback` + Gemini audio when the browser can't do it.

### Phase 1 — The learning loop & guided path · 3–6 weeks

7. **Curriculum spine (HSK 1–6)**
   - Add `src/data/hsk/*.ts` word/character banks (frequency-ordered, HSK-tagged) and a **curriculum graph**: `Unit → Lessoons → Practice → Review → Unit test`.
   - Placement quiz (adaptive, ~15 items) → recommended starting unit. Fresh users start at HSK1, not 覆.
8. **Progress dashboard (new "Progress" view or replace home)**
   - Today's plan ("X new · Y due · Z minutes"), streak calendar heatmap, per-skill accuracy, review-retention curve, HSK coverage % ("you know 312/1,200 HSK3 words"), recent achievements.
   - XP + level from *real* events; medals only for evidence-backed milestones.
9. **Input engine (comprehensible input)**
   - Tap-to-translate in every reader (readers & stories), "➕ Add to SRS" button per word/sentence, auto-mining new words from completed texts.
   - Sentence bank with TTS, speed 0.8× default, and "shadow this sentence" jump-to-speaking.
10. **Voice-native AI tutor**
   - `/api/conversation/chat` → streaming (SSE) + scenario packs + level-adaptive difficulty.
   - Add audio-in: record → send audio file to Gemini → spoken-grade the reply; let the tutor *speak back* (AI TTS) with a repeat/slower button.
11. **Content volume**
    - Pipeline scripts (`scripts/getHsk.js`) to generate typed data for HSK 1–6 words/characters; AI-assisted examples & mnemonics (reviewed, cached); keep everything offline-first where possible.

### Phase 2 — Power & scale · 6–12 weeks

12. **Offline & PWA**
   - Bundle/precache `hanzi-writer-data` for the HSK character set (kill the CDN dependency); service worker caches AI TTS; app manifest + installable + basic offline notifications for streaks.
13. **Accounts & sync (only after local-first is solid)**
   - Optional account (Supabase/Postgres + JWT, or Clerk) that syncs the progress-store JSON; per-device offline with conflict-tolerant last-write-wins; full data export/delete (GDPR-friendly).
14. **Speaking at scale**
   - Syllable/tone-level scoring overlay for shadowing; pronunciation difficulty heatmap ("your zh/ch/s get confused"); spaced *re*recording reviews.
15. **Writing at scale**
   - Freehand grading: compare drawn stroke paths to target (Skritter-style) using normalized DTW/curvature similarity; error-mirror UI; full HSK stroke bank.
16. **Measurement loop**
   - Lightweight event log (`activity` array in progress store + optional server telemetry endpoint): session, reviews, correct/gradings, streak, AI calls; simple "insights" panel.
   - Define north-star + guardrail metrics (below) and instrument A/B hooks for the streak & SRS changes.
17. **i18n & a11y sweep**
   - Locale layer (zh/en at minimum; strings table), `lang`/`dir` handling, modal focus trap + Escape, `aria` labels on canvas controls, keyboard navigation for SRS & readers, high-contrast pass.
18. **Server hardening**
   - Rate limiting on AI endpoints, request size caps, response caching for `/api/text/analyze` and `/api/character/analyze` (keyed by input + model version), request id + logging, optional cost ceiling.

### 4.1 Fifteen quick wins (do these while the big items land)

1. Replace hardcoded streak with the Daily-Routine-derived value (smallest trust fix).
2. Persist `SrsFlashcards` `reviewCount` and card order by `dueDate`.
3. Wire `onScoreUpdate` from `ListeningSkill` into a visible "listening accuracy" stat.
4. Add "Add to my words" (→ SRS queue) button in `TextPinyinizer` and readers.
5. TTS button with speed toggle on *every* hanzi/word/sentence occurrence (Phrases, stories, flashcards).
6. `Escape` closes `ThemeModal`; add overlay click-to-close.
7. Global search: one input in the Header that jumps to character/word across all skills (data already exists).
8. Daily recap toast: "Day 12 streak · 34 reviews · 3 new characters".
9. Print-friendly study sheet: combine TianZiGe + SRS card for the week's words.
10. `lang="zh-CN"` on spoken UI copy; title attributes on icon-only buttons (a11y).
11. HSK filter persisted on SRS review; show "due today" count in the Reading tab badge.
12. Confetti proportionality: keep it, but tie to *evidence* (correct streak of N).
13. Handle `hanzi-writer-data` network failures with the existing precache + a toast "offline stroke data used".
14. Add `aria-live` announcements for quiz results (screen readers hear "Correct!").
15. Make the AI chat history downloadable/exportable (own your conversations).

---

## 5. Metrics that matter (north-star thinking)

| Category | Metric | Why |
|---|---|---|
| **Activation** | % new users completing placement + first daily routine in session 1 | Onboarding quality; the current app has none |
| **Retention** | D1 / D7 / D30; streak integrity (streak kept ≥ 7d users) | Core measure of "effective"; Duolingo-style loop |
| **Learning behaviour** | Reviews/day, new cards/day, due-on-time %, review accuracy trend | SRS health & load balance |
| **Outcome (proxy)** | HSK coverage % per level; chars mastered via SRS (not star toggle) | Signals real attainment, not engagement theater |
| **AI value** | Chat sessions/user, speech feedback helpfulness rating, AI latency p50/p95 | Cost–value of Gemini spend |
| **Guardrails** | AI error/fallback rate, localStorage quota warnings, crash rate | Protect trust & the offline story |

---

## 6. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **AI cost/latency** | Cache analyses; cap per-user daily AI calls; default to offline analyzers for deterministic tasks (they already exist); stream responses |
| **Content licensing** | Use HSK-based public lists & your own generated examples; avoid scraping Tatoeba/CC-CEDICT without license compliance (CC BY-SA credit) |
| **Scope creep** | Everything above maps to the existing 5 server endpoints + a handful of utils; no rewrite needed — this is additive |
| **Mobile drawing UX** | Deliver PWA + pointer-events pass; canvas already touch-capable via hanzi-writer |
| **Churn from harsh gamification** | Streak repair/freeze; no data loss states; medals only for evidence milestones |
| **localStorage limits** | Single versioned store + compaction; export prompts when >80% quota |

---

## 7. Suggested next actions (this week)

1. Add `src/utils/progressStore.ts` + `streaks.ts` and delete the hardcoded `7` (P0-1, P0-2).
2. Make `SrsFlashcards` persistent with a real `dueDate` sort (P0-3).
3. Add the "Due today" badge to the Reading tab / Header (visible win, tiny code).
4. Rough-cut the Progress dashboard wireframe on paper before Phase 1 coding.

---

## Appendix — sources consulted

- Wikipedia — *Spaced repetition* (forgetting curve, Leitner, SM-2/SM-5, software)
- FSRS / open-spaced-repetition (algorithm parameters), docs & community wiki
- Wikipedia — *Language acquisition* / SLA (Krashen input hypothesis, Swain output hypothesis, interaction)
- MDN — *Web Speech API* (SpeechRecognition deprecation; SpeechSynthesis interfaces & security)
- Wikipedia — *Duolingo* (learning model, gamification, SRS, criticism)
- Hacking Chinese (hackingchinese.com) — Mandarin pedagogy & habit-building
- Skritter (skritter.com) — character-writing SRS, stroke grading
- Wikipedia — *Gamification* (techniques, effectiveness, pointsification critique)
- Pleco Software (Wikipedia disambiguation entry + product knowledge) — dictionary/reader/SRS workflow

*All recommendations were validated against this codebase's actual files and verified build output.*