<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/035d686a-5b85-4d8c-832d-32cc27c7a0a2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Expanding the content banks

Every lesson item is a typed object in `src/data/`. Add to the batch file, and it shows up
in the app automatically — no component changes are needed.

| Content | Add to | Merged into |
|---|---|---|
| Characters (Hanzi) | `src/data/expandedCharacters.ts` (`CharacterData[]`) | `CHARACTERS_DATABASE` — Writing canvas/dropdown, SRS deck, placement quiz, radicals |
| Reading stories | `src/data/expandedStories.ts` (`ReadingStory[]`) | `READING_STORIES` — Reading tab + HSK filter |
| Listening exercises | `src/data/expandedAudioPhrases.ts` (`EXPANDED_LISTENING_EXERCISES`) | `LISTENING_EXERCISES` — Listening comprehension |
| Speaking phrases | `src/data/expandedAudioPhrases.ts` (`EXPANDED_SPEAKING_PHRASES`) | `SPEAKING_PHRASES` — Pronunciation clinic + shadowing |
| Tone questions, chengyu, tongue twisters, minimal pairs, pinyin sounds | `src/data/chineseData.ts` (directly) | Same-named exports |

### Steps for a new batch

1. Append entries to the relevant file (keep ids unique, e.g. `cha-tea`, `story-takeout`).
2. `npm run check:data` — validates every bank (see below). Fix anything it reports.
3. `npm run fetch:strokes` — bundles offline stroke vectors for any new character
   (rewrites `src/data/strokeDataExpanded.ts`; requires network once).
4. `npm run lint` — `tsc --noEmit`.
5. `npm run build` — confirm the Vite build still succeeds.

### What `scripts/checkData.ts` enforces

`npm run check:data` (or `bun scripts/checkData.ts`) fails with exit code 1 on hard errors and
prints warnings for soft ones:

- unique `id` in every collection; non-empty collections
- characters: `strokeSequence.length === strokeCount`, sequential `step` numbers, tone 1–5,
  HSK 1–6, single-hanzi, examples present
- listening: `correctIndex` inside `options`, non-empty `audioText` (the TTS input), no duplicate options
- speaking: `tones[]` values 1–5, tone count vs. the pinyin syllable count, known `category`/`difficulty`
- stories: paragraphs + word tokens present, every `token.char` actually occurs in its paragraph,
  question `correctIndex` in range
- chengyu: exactly four characters, `characters` matching `idiom`

It also prints a coverage summary (counts per HSK level), so you can see at a glance where the
bank is thin.

> **Stroke data:** `src/data/strokeData.ts` holds two layers. `CORE_STROKES` is the
> hand-curated map; `src/data/strokeDataExpanded.ts` (auto-generated) holds the vectors for every
> other character in `CHARACTERS_DATABASE`, merged into `PRECACHED_STROKES`. Together they cover
> the whole bank, so the writing canvas, stroke animation and dictation work offline. Re-run
> `npm run fetch:strokes` after adding characters — anything still missing is fetched from the
> `hanzi-writer-data` CDN at runtime and cached for the session.

