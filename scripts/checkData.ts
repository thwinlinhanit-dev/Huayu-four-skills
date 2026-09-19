/**
 * Content integrity checker for the Huayu data banks.
 *
 * Usage (from the project root):
 *   bun scripts/checkData.ts      or      bun run check:data
 *
 * Hard errors exit with code 1 (safe to use as a build/CI gate).
 * Warnings are printed but do not fail the run.
 */
import {
  CHARACTERS_DATABASE,
  TONE_QUESTIONS,
  LISTENING_EXERCISES,
  SPEAKING_PHRASES,
  READING_STORIES,
  RADICALS_LIST,
  PINYIN_SOUNDS,
  CHENGYU_DATABASE,
  TONGUE_TWISTERS,
  MINIMAL_PAIRS,
} from '../src/data/chineseData';

const errors: string[] = [];
const warnings: string[] = [];

const fail = (msg: string) => errors.push(msg);
const warn = (msg: string) => warnings.push(msg);

const VOWELS = /[aeiouāáǎàēéěèīíǐìōóǒòūúǔùǖǘǜü]/i;

/** Count spoken syllables in a pinyin string (vowel-cluster approximation). */
function countSyllables(pinyin: string): number {
  let count = 0;
  let inCluster = false;
  for (const raw of pinyin) {
    const isVowel = VOWELS.test(raw);
    if (isVowel && !inCluster) count += 1;
    inCluster = isVowel;
  }
  return count;
}

const collections: { name: string; items: { id: string }[] }[] = [
  { name: 'CHARACTERS_DATABASE', items: CHARACTERS_DATABASE },
  { name: 'TONE_QUESTIONS', items: TONE_QUESTIONS },
  { name: 'LISTENING_EXERCISES', items: LISTENING_EXERCISES },
  { name: 'SPEAKING_PHRASES', items: SPEAKING_PHRASES },
  { name: 'READING_STORIES', items: READING_STORIES },
  { name: 'CHENGYU_DATABASE', items: CHENGYU_DATABASE },
  { name: 'TONGUE_TWISTERS', items: TONGUE_TWISTERS },
  { name: 'MINIMAL_PAIRS', items: MINIMAL_PAIRS },
];

// ---------------------------------------------------------------- 1. unique ids
for (const { name, items } of collections) {
  if (items.length === 0) fail(`${name} is empty`);
  const seen = new Map<string, number>();
  items.forEach((item, index) => {
    if (!item.id || !item.id.trim()) {
      fail(`${name}[${index}] has an empty id`);
      return;
    }
    const prev = seen.get(item.id);
    if (prev !== undefined) {
      fail(`${name}[${index}] duplicate id "${item.id}" (first seen at index ${prev})`);
    } else {
      seen.set(item.id, index);
    }
  });
}

// ------------------------------------------------------------ 2. characters
const charIndex = new Map<string, number>();
CHARACTERS_DATABASE.forEach((c, index) => {
  const at = `CHARACTERS_DATABASE[${index}] "${c.character}"`;

  const prev = charIndex.get(c.character);
  if (prev !== undefined) {
    warn(`${at} duplicates index ${prev} — the SRS deck and quizzes will list it twice`);
  } else {
    charIndex.set(c.character, index);
  }

  if (c.strokeSequence.length !== c.strokeCount) {
    fail(
      `${at} strokeCount=${c.strokeCount} but strokeSequence has ${c.strokeSequence.length} steps`
    );
  }
  c.strokeSequence.forEach((stroke, i) => {
    if (stroke.step !== i + 1) fail(`${at} strokeSequence[${i}] has step=${stroke.step}, expected ${i + 1}`);
    if (!stroke.type || !stroke.name) fail(`${at} strokeSequence[${i}] is missing type/name`);
  });
  if (c.tone < 1 || c.tone > 5) fail(`${at} tone=${c.tone} is outside 1-5`);
  if (c.hskLevel < 1 || c.hskLevel > 6) fail(`${at} hskLevel=${c.hskLevel} is outside 1-6`);
  if (!c.character || Array.from(c.character).length !== 1) fail(`${at} character is not a single hanzi`);
  if (!c.pinyin.trim()) fail(`${at} is missing pinyin`);
  if (!c.radical.trim()) fail(`${at} is missing a radical`);
  if (!c.meaning.trim()) fail(`${at} is missing a meaning`);
  if (c.examples.length < 2) warn(`${at} only has ${c.examples.length} example word(s)`);
  c.examples.forEach((ex, i) => {
    if (!ex.word || !ex.pinyin || !ex.meaning) fail(`${at} examples[${i}] is incomplete`);
    if (!ex.word.includes(c.character)) {
      warn(`${at} examples[${i}] "${ex.word}" does not contain the character`);
    }
  });
  if (!c.etymology || !c.etymology.trim()) warn(`${at} is missing an etymology note`);
});

// --------------------------------------------------------- 3. tone questions
TONE_QUESTIONS.forEach((q, index) => {
  const at = `TONE_QUESTIONS[${index}] "${q.id}"`;
  if (q.tone < 1 || q.tone > 4) fail(`${at} tone=${q.tone} is outside 1-4`);
  if (!q.character || !q.pinyin || !q.meaning) fail(`${at} is missing character/pinyin/meaning`);
  if (q.distractors.length < 2) fail(`${at} needs at least 2 distractors`);
  q.distractors.forEach((d, i) => {
    if (d.tone < 1 || d.tone > 4) fail(`${at} distractors[${i}] tone=${d.tone} is outside 1-4`);
    if (d.tone === q.tone) fail(`${at} distractors[${i}] repeats the correct tone`);
    if (!d.character || !d.pinyin || !d.meaning) fail(`${at} distractors[${i}] is incomplete`);
  });
});

// ------------------------------------------------------ 4. listening exercises
LISTENING_EXERCISES.forEach((ex, index) => {
  const at = `LISTENING_EXERCISES[${index}] "${ex.id}"`;
  if (!ex.chinese.trim()) fail(`${at} is missing chinese text`);
  if (!ex.audioText.trim()) fail(`${at} is missing audioText (TTS input)`);
  if (!ex.pinyin.trim()) fail(`${at} is missing pinyin`);
  if (!ex.english.trim()) fail(`${at} is missing English`);
  if (!ex.question.trim()) fail(`${at} is missing a question`);
  if (!ex.explanation.trim()) warn(`${at} is missing an explanation`);
  if (ex.options.length < 2) fail(`${at} has fewer than 2 options`);
  if (ex.correctIndex < 0 || ex.correctIndex >= ex.options.length) {
    fail(`${at} correctIndex=${ex.correctIndex} is outside 0-${ex.options.length - 1}`);
  }
  if (new Set(ex.options).size !== ex.options.length) fail(`${at} has duplicate options`);
});

// ------------------------------------------------------- 5. speaking phrases
SPEAKING_PHRASES.forEach((p, index) => {
  const at = `SPEAKING_PHRASES[${index}] "${p.id}"`;
  if (!p.chinese.trim()) fail(`${at} is missing chinese text`);
  if (!p.pinyin.trim()) fail(`${at} is missing pinyin`);
  if (!p.english.trim()) fail(`${at} is missing English`);
  if (p.tones.length === 0) fail(`${at} has an empty tones array`);
  p.tones.forEach((t, i) => {
    if (t < 1 || t > 5) fail(`${at} tones[${i}]=${t} is outside 1-5`);
  });
  const syllables = countSyllables(p.pinyin);
  if (p.tones.length !== syllables) {
    warn(`${at} tones has ${p.tones.length} entries but pinyin looks like ${syllables} syllable(s)`);
  }
  if (!['Greetings', 'Daily', 'Travel', 'Tongue Twister', 'Idiom'].includes(p.category)) {
    fail(`${at} category "${p.category}" is not a known category`);
  }
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(p.difficulty)) {
    fail(`${at} difficulty "${p.difficulty}" is not a known level`);
  }
});

// --------------------------------------------------------- 6. reading stories
let tokenMisses = 0;
READING_STORIES.forEach((story, index) => {
  const at = `READING_STORIES[${index}] "${story.id}"`;
  if (!story.titleChinese.trim() || !story.titlePinyin.trim() || !story.titleEnglish.trim()) {
    fail(`${at} is missing a title`);
  }
  if (story.hskLevel < 1 || story.hskLevel > 6) fail(`${at} hskLevel=${story.hskLevel} is outside 1-6`);
  if (story.paragraphs.length === 0) fail(`${at} has no paragraphs`);
  story.paragraphs.forEach((p, pi) => {
    if (!p.chinese.trim()) fail(`${at} paragraphs[${pi}] is missing chinese`);
    if (!p.pinyin.trim()) fail(`${at} paragraphs[${pi}] is missing pinyin`);
    if (!p.english.trim()) warn(`${at} paragraphs[${pi}] is missing English`);
    if (p.wordTokens.length < 3) warn(`${at} paragraphs[${pi}] only has ${p.wordTokens.length} word token(s)`);
    p.wordTokens.forEach((token, ti) => {
      if (!token.char || !token.pinyin || !token.meaning) {
        fail(`${at} paragraphs[${pi}].wordTokens[${ti}] is incomplete`);
      }
      if (!p.chinese.includes(token.char)) {
        tokenMisses += 1;
        warn(`${at} paragraphs[${pi}].wordTokens[${ti}] "${token.char}" does not appear in the Chinese text`);
      }
    });
  });
  if (story.questions.length === 0) fail(`${at} has no comprehension questions`);
  story.questions.forEach((q, qi) => {
    if (!q.question.trim()) fail(`${at} questions[${qi}] is missing text`);
    if (q.options.length < 2) fail(`${at} questions[${qi}] has fewer than 2 options`);
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      fail(`${at} questions[${qi}] correctIndex=${q.correctIndex} is out of range`);
    }
    if (!q.explanation.trim()) warn(`${at} questions[${qi}] is missing an explanation`);
  });
});

// ------------------------------------------------------- 7. smaller references
RADICALS_LIST.forEach((r, index) => {
  if (!r.radical || !r.pinyin || !r.meaning) fail(`RADICALS_LIST[${index}] is incomplete`);
  if (r.examples.length === 0) warn(`RADICALS_LIST[${index}] "${r.radical}" has no examples`);
});

PINYIN_SOUNDS.forEach((s, index) => {
  if (!s.symbol || !s.ipa || !s.exampleChar) fail(`PINYIN_SOUNDS[${index}] is incomplete`);
  if (!['initial', 'simpleFinal', 'compoundFinal', 'nasalFinal'].includes(s.category)) {
    fail(`PINYIN_SOUNDS[${index}] "${s.symbol}" has an unknown category "${s.category}"`);
  }
});

CHENGYU_DATABASE.forEach((c, index) => {
  const at = `CHENGYU_DATABASE[${index}] "${c.id}"`;
  if (Array.from(c.idiom).length !== 4) fail(`${at} idiom "${c.idiom}" is not 4 characters`);
  if (c.characters.length !== 4) fail(`${at} characters has ${c.characters.length} entries, expected 4`);
  if (c.characters.join('') !== c.idiom) {
    warn(`${at} characters "${c.characters.join('')}" does not match idiom "${c.idiom}"`);
  }
  if (!c.pinyin.trim() || !c.literal.trim() || !c.figurative.trim()) fail(`${at} is incomplete`);
  if (!c.story.trim()) warn(`${at} is missing a story`);
});

TONGUE_TWISTERS.forEach((t, index) => {
  const at = `TONGUE_TWISTERS[${index}] "${t.id}"`;
  if (!t.title.trim() || !t.chinese.trim() || !t.pinyin.trim()) fail(`${at} is incomplete`);
  if (!t.focus.trim()) warn(`${at} is missing a focus sound`);
});

MINIMAL_PAIRS.forEach((m, index) => {
  const at = `MINIMAL_PAIRS[${index}] "${m.id}"`;
  if (!m.itemA.char || !m.itemA.pinyin || !m.itemB.char || !m.itemB.pinyin) fail(`${at} is incomplete`);
  if (m.itemA.char === m.itemB.char) warn(`${at} both items are the same character`);
});

// ------------------------------------------------------------------ reporting
const counts: [string, number][] = [
  ['characters', CHARACTERS_DATABASE.length],
  ['tone questions', TONE_QUESTIONS.length],
  ['listening exercises', LISTENING_EXERCISES.length],
  ['speaking phrases', SPEAKING_PHRASES.length],
  ['reading stories', READING_STORIES.length],
  ['radicals', RADICALS_LIST.length],
  ['pinyin sounds', PINYIN_SOUNDS.length],
  ['chengyu', CHENGYU_DATABASE.length],
  ['tongue twisters', TONGUE_TWISTERS.length],
  ['minimal pairs', MINIMAL_PAIRS.length],
];

const spread = (map: Map<number, number>) =>
  [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, n]) => `HSK${level}:${n}`)
    .join(' ');

console.log('Huayu content banks');
console.log('-------------------');
for (const [label, count] of counts) console.log(`  ${label.padEnd(20)} ${count}`);

const byHsk = new Map<number, number>();
for (const c of CHARACTERS_DATABASE) byHsk.set(c.hskLevel, (byHsk.get(c.hskLevel) ?? 0) + 1);
console.log(`  characters by HSK    ${spread(byHsk)}`);

const storiesByHsk = new Map<number, number>();
for (const s of READING_STORIES) storiesByHsk.set(s.hskLevel, (storiesByHsk.get(s.hskLevel) ?? 0) + 1);
console.log(`  stories by HSK       ${spread(storiesByHsk)}`);
if (tokenMisses > 0) console.log(`  token mismatches     ${tokenMisses}`);

console.log('');
for (const w of warnings) console.log(`[WARN] ${w}`);
for (const e of errors) console.log(`[FAIL] ${e}`);
console.log('');
console.log(`Result: ${errors.length} error(s), ${warnings.length} warning(s)`);

if (errors.length > 0) process.exit(1);
