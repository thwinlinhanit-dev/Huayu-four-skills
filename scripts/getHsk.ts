/**
 * HSK 1-6 bulk character generator.
 *
 * Usage (from the project root):
 *   bun scripts/getHsk.ts                     # all levels
 *   bun scripts/getHsk.ts --levels=1,2        # subset
 *   bun scripts/getHsk.ts --limit=50          # quick sample
 *   bun scripts/getHsk.ts --dry-run           # report only, write nothing
 *
 * Sources (cached under .cache/):
 *   - HSK 2012 official word lists  → level, pinyin, gloss, example words
 *   - makemeahanzi dictionary.txt   → radical + short definition
 *   - cnchar-order                  → authoritative stroke order + stroke names
 *   - hanzi-writer-data             → stroke count cross-check + geometry used to
 *                                     disambiguate the few letters that name two strokes
 *
 * Output: src/data/hskGeneratedCharacters.ts (CharacterData[]).
 * Every generated entry is validated by `bun scripts/checkData.ts`.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CharacterData } from '../src/types';
import { CHARACTERS_DATABASE } from '../src/data/chineseData';
import { loadCncharOrders, loadHskWords, loadMakeMeAHanzi, loadStrokeVectors, type HskWord } from './lib/sources';

type Args = { levels: number[]; limit: number; dryRun: boolean; out: string };

function parseArgs(): Args {
  const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
  const levels = (arg('levels') ?? '1,2,3,4,5,6')
    .split(',')
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 6);
  return {
    levels: levels.length ? levels : [1, 2, 3],
    limit: parseInt(arg('limit') ?? '0', 10) || 0,
    dryRun: process.argv.includes('--dry-run'),
    out: arg('out') ?? 'src/data/hskGeneratedCharacters.ts',
  };
}

// ---------------------------------------------------------------- pinyin helpers
const TONE_MARKS: Record<string, string[]> = {
  a: ['a', 'ā', 'á', 'ǎ', 'à'],
  e: ['e', 'ē', 'é', 'ě', 'è'],
  i: ['i', 'ī', 'í', 'ǐ', 'ì'],
  o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
  u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
  ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

/** "hao3" → "hǎo"; "ma5" / "ma" → tone-neutral "ma". */
export function numberedToDiacritic(syllable: string): string {
  const match = syllable.trim().match(/^([^0-9]*)([0-5]?)$/);
  if (!match) return syllable;
  const body = match[1].toLowerCase().replace(/u:/g, 'ü').replace(/v/g, 'ü');
  const tone = parseInt(match[2] || '5', 10);
  if (tone === 5 || !body) return body;
  const target = body.includes('a')
    ? 'a'
    : body.includes('e')
      ? 'e'
      : body.includes('ou')
        ? 'o'
        : [...body].reverse().find((ch) => 'aeiouü'.includes(ch));
  if (!target) return body;
  return body.replace(target, TONE_MARKS[target][tone]);
}

/** Tone number from numbered or diacritic pinyin ("hao3" → 3, neutral → 5). */
export function toneOf(syllable: string): number {
  const m = syllable.trim().match(/([0-5])$/);
  if (m) {
    const n = parseInt(m[1], 10);
    return n === 0 ? 5 : n;
  }
  const marks: [RegExp, number][] = [
    [/[āēīōūǖ]/, 1],
    [/[áéíóúǘ]/, 2],
    [/[ǎěǐǒǔǚ]/, 3],
    [/[àèìòùǜ]/, 4],
  ];
  for (const [re, tone] of marks) if (re.test(syllable)) return tone;
  return 5;
}

// --------------------------------------------------------- stroke-name resolution
interface LetterDef {
  names: string[];
  english: string[];
}

/** cnchar letter → app stroke types; the first entry is the default. */
const LETTER_STROKES: Record<string, LetterDef> = {
  j: { names: ['横'], english: ['Horizontal'] },
  f: { names: ['竖'], english: ['Vertical'] },
  s: { names: ['撇'], english: ['Left Falling'] },
  l: { names: ['捺'], english: ['Right Falling'] },
  k: { names: ['点'], english: ['Dot'] },
  d: { names: ['点'], english: ['Dot (variant)'] },
  i: { names: ['提'], english: ['Upward Flick'] },
  g: { names: ['竖钩'], english: ['Vertical Hook'] },
  t: { names: ['弯钩'], english: ['Curved Hook'] },
  y: { names: ['斜钩', '卧钩'], english: ['Slanting Hook', 'Cradle Hook'] },
  c: { names: ['横折'], english: ['Horizontal Fold'] },
  r: { names: ['横折钩'], english: ['Horizontal Fold Hook'] },
  e: { names: ['横撇', '横钩'], english: ['Horizontal Then Left Falling', 'Horizontal Hook'] },
  n: { names: ['撇折'], english: ['Left Falling Fold'] },
  m: { names: ['撇点'], english: ['Left Falling Dot'] },
  h: { names: ['竖提'], english: ['Vertical Then Upward Flick'] },
  p: { names: ['横折提'], english: ['Fold and Rise'] },
  u: { names: ['竖弯钩'], english: ['Vertical Bend Hook'] },
  b: { names: ['竖弯'], english: ['Vertical Bend'] },
  a: { names: ['横折折撇'], english: ['Double Fold Then Left Falling'] },
  x: { names: ['竖折撇', '竖折折'], english: ['Vertical Fold Then Left Falling', 'Double Fold'] },
  v: { names: ['横折折', '横折弯'], english: ['Double Fold', 'Fold and Bend'] },
  z: { names: ['竖折折钩'], english: ['Double Fold Hook'] },
  o: { names: ['横斜钩'], english: ['Fold and Slanting Hook'] },
  q: { names: ['横折折折'], english: ['Triple Fold'] },
  w: { names: ['横折折折钩', '横撇弯钩'], english: ['Triple Fold Hook', 'Horizontal Left-falling Bend Hook'] },
};

/** Pick between the two stroke names a letter can stand for, using stroke geometry. */
function resolveAmbiguous(letter: string, median: number[][] | undefined): number {
  const def = LETTER_STROKES[letter];
  if (!def || def.names.length < 2) return 0;
  if (!median || median.length < 2) return 0;
  const pts = median.filter((p) => Array.isArray(p) && p.length >= 2);
  if (pts.length < 2) return 0;
  const dx = Math.abs(pts[pts.length - 1][0] - pts[0][0]);
  const dy = Math.abs(pts[pts.length - 1][1] - pts[0][1]) || 1;
  if (letter === 'y') return dx / dy >= 2.5 ? 1 : 0; // wide arc → 卧钩 (心), steep → 斜钩 (我)
  if (letter === 'e') {
    // 横撇 carries a long left-falling tail; 横钩 ends in a short hook.
    const len = pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0) || 1;
    const mid = pts[Math.floor(pts.length / 2)];
    const tail = Math.hypot(pts[pts.length - 1][0] - mid[0], pts[pts.length - 1][1] - mid[1]);
    return tail / len > 0.45 ? 0 : 1;
  }
  return 0;
}

/** Radical side-forms → the full character whose definition explains them. */
const RADICAL_FORM_TO_FULL: Record<string, string> = {
  亻: '人',
  刂: '刀',
  讠: '言',
  忄: '心',
  扌: '手',
  氵: '水',
  犭: '犬',
  纟: '糸',
  饣: '食',
  钅: '金',
  衤: '衣',
  礻: '示',
  灬: '火',
  罒: '网',
  牜: '牛',
  ⺮: '竹',
  ⻊: '足',
  ⺈: '刀',
  ⻗: '雨',
  ⻝: '食',
  阝: '邑',
};

// ------------------------------------------------------------------- generation
interface Built {
  level: number;
  entry: CharacterData;
}

const clean = (text: string) => text.replace(/\s+/g, ' ').replace(/[.;]+$/, '').trim();

interface Info {
  level: number;
  gloss?: string;
  pinyin?: string;
  tone?: number;
  words: HskWord[];
  order: number;
}

async function main() {
  const args = parseArgs();
  console.log(`HSK generator — levels ${args.levels.join(', ')}${args.dryRun ? ' (dry run)' : ''}`);

  const words = await loadHskWords(args.levels);
  console.log(`  HSK word entries loaded: ${words.length}`);
  const mma = await loadMakeMeAHanzi();
  console.log(`  makemeahanzi characters: ${mma.size}`);
  const { orders } = await loadCncharOrders();
  console.log(`  cnchar stroke-order characters: ${Object.keys(orders).length}`);

  // Characters already hand-authored in the app win; the merge de-dupes by character.
  const curated = new Set(CHARACTERS_DATABASE.map((c) => c.character));

  // --- collect per-character metadata from the word lists ---------------------
  const info = new Map<string, Info>();

  const ensure = (ch: string, level: number, order: number): Info => {
    let rec = info.get(ch);
    if (!rec) {
      rec = { level, words: [], order };
      info.set(ch, rec);
    } else if (level < rec.level) {
      rec.level = level;
    }
    return rec;
  };

  // Pass 1: single-character entries give the authoritative level / pinyin / gloss.
  words.forEach((w, wordIndex) => {
    const chars = Array.from(w.word);
    if (chars.length !== 1) return;
    const ch = chars[0];
    if (!/\p{Script=Han}/u.test(ch)) return;
    const rec = ensure(ch, w.level, wordIndex);
    rec.gloss ??= clean(w.gloss);
    rec.pinyin ??= numberedToDiacritic(w.numberedPinyin);
    rec.tone ??= toneOf(w.numberedPinyin);
    if (w.level < rec.level) rec.level = w.level;
  });

  // Pass 2: multi-character words provide example words (and fill any gaps).
  words.forEach((w, wordIndex) => {
    const chars = Array.from(w.word);
    if (chars.length < 2) return;
    const syllables = w.numberedPinyin.split(/\s+/).filter(Boolean);
    const aligned = syllables.length === chars.length;
    chars.forEach((ch, idx) => {
      if (!/\p{Script=Han}/u.test(ch)) return;
      const rec = ensure(ch, w.level, wordIndex);
      rec.gloss ??= '';
      rec.pinyin ??= aligned ? numberedToDiacritic(syllables[idx]) : undefined;
      rec.tone ??= aligned ? toneOf(syllables[idx]) : undefined;
      if (rec.words.length < 40) rec.words.push(w);
    });
  });

  // Drop helper fields that were never filled.
  for (const [ch, rec] of info) {
    if (!rec.pinyin && !rec.gloss) info.delete(ch);
  }
  console.log(`  unique characters discovered: ${info.size}`);

  const candidates = [...info.entries()]
    .filter(([ch]) => !curated.has(ch))
    .sort((a, b) => a[1].level - b[1].level || a[1].order - b[1].order);
  console.log(`  not yet in the app: ${candidates.length}`);

  // --- build entries -----------------------------------------------------------
  const skipped: { char: string; reason: string }[] = [];
  const ambiguousUse = new Map<string, number>();
  const built: Built[] = [];
  const limited = args.limit > 0 ? candidates.slice(0, args.limit) : candidates;

  let done = 0;
  for (const [char, meta] of limited) {
    done += 1;
    if (done % 200 === 0) console.log(`    ...${done}/${limited.length}`);

    const order = orders[char];
    if (!order) {
      skipped.push({ char, reason: 'no stroke-order data' });
      continue;
    }
    const vectors = await loadStrokeVectors(char);
    if (!vectors || !Array.isArray(vectors.strokes) || vectors.strokes.length === 0) {
      skipped.push({ char, reason: 'no stroke vectors' });
      continue;
    }
    if (vectors.strokes.length !== order.length) {
      skipped.push({ char, reason: `stroke count conflict (cnchar ${order.length} vs writer ${vectors.strokes.length})` });
      continue;
    }

    const strokeSequence = Array.from(order).map((letter, index) => {
      const def = LETTER_STROKES[letter];
      const choice = def ? resolveAmbiguous(letter, vectors.medians[index]) : 0;
      const type = def ? def.names[choice] : '笔画';
      const english = def ? def.english[choice] ?? '' : '';
      if (def && def.names.length > 1) ambiguousUse.set(letter, (ambiguousUse.get(letter) ?? 0) + 1);
      return { step: index + 1, type, name: english ? `${type} (${english})` : type };
    });

    const record = mma.get(char);
    const radical = record?.radical?.trim() || '';
    const radicalMeaning = radical
      ? clean(mma.get(RADICAL_FORM_TO_FULL[radical] ?? radical)?.definition ?? '')
      : '';

    const pinyin = meta.pinyin || (record?.pinyin?.[0] ? clean(record.pinyin[0]) : '');
    const tone = meta.tone ?? (record?.pinyin?.[0] ? toneOf(record.pinyin[0]) : 5);
    const meaning = meta.gloss || clean(record?.definition ?? '') || `${char} (HSK ${meta.level})`;

    const examples: { word: string; pinyin: string; meaning: string }[] = [];
    const seen = new Set<string>();
    for (const w of [...meta.words].sort((a, b) => a.word.length - b.word.length || a.level - b.level)) {
      if (seen.has(w.word)) continue;
      seen.add(w.word);
      examples.push({ word: w.word, pinyin: w.pinyin, meaning: clean(w.gloss) });
      if (examples.length === 3) break;
    }

    built.push({
      level: meta.level,
      entry: {
        id: `hsk-${char}`,
        character: char,
        pinyin,
        tone: (tone >= 1 && tone <= 5 ? tone : 5) as 1 | 2 | 3 | 4 | 5,
        meaning,
        radical: radical || '—',
        radicalMeaning: radicalMeaning || 'radical information unavailable',
        strokeCount: vectors.strokes.length,
        hskLevel: meta.level,
        examples,
        strokeSequence,
      },
    });
  }

  // ------------------------------------------------------------- reporting
  const byLevel = new Map<number, number>();
  for (const b of built) byLevel.set(b.level, (byLevel.get(b.level) ?? 0) + 1);

  const payload = built.map((b) => `  ${JSON.stringify(b.entry)}, // ${b.entry.character}`).join('\n');
  const file = `// AUTO-GENERATED by scripts/getHsk.ts — do not edit by hand.
// Re-run \`bun scripts/getHsk.ts\`, then \`bun scripts/fetchStrokes.ts\` and
// \`bun scripts/checkData.ts\`.
//
// Fields come from real datasets: HSK 2012 word lists (level, pinyin, gloss,
// example words), makemeahanzi (radical, definition), cnchar-order (stroke order
// and stroke names) and hanzi-writer-data (stroke counts, verified 1:1).
import type { CharacterData } from '../types';

export const HSK_GENERATED_CHARACTERS: CharacterData[] = [
${payload}
];
`;

  console.log('\nGenerated characters:');
  for (const [level, count] of [...byLevel.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  HSK ${level}: ${count}`);
  }
  console.log(`  total: ${built.length}`);
  if (ambiguousUse.size > 0) {
    console.log('  geometry-disambiguated strokes: ' + [...ambiguousUse.entries()].map(([l, n]) => `${l}=${n}`).join(' '));
  }
  const noExamples = built.filter((b) => b.entry.examples.length < 2).length;
  const noRadical = built.filter((b) => b.entry.radical === '—').length;
  if (noExamples) console.log(`  entries with fewer than 2 example words: ${noExamples}`);
  if (noRadical) console.log(`  entries without radical data: ${noRadical}`);
  if (skipped.length) {
    console.log(`  skipped: ${skipped.length}`);
    const grouped = new Map<string, string[]>();
    for (const s of skipped) {
      const list = grouped.get(s.reason) ?? [];
      if (list.length < 25) list.push(s.char);
      grouped.set(s.reason, list);
    }
    for (const [reason, chars] of grouped) console.log(`    ${reason}: ${chars.join('')}`);
  }

  if (args.dryRun) {
    console.log('\nDry run — nothing written.');
    return;
  }

  writeFileSync(resolve(process.cwd(), args.out), file, 'utf8');
  console.log(`\nWrote ${built.length} characters (${Math.round(file.length / 1024)} KB) to ${args.out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
