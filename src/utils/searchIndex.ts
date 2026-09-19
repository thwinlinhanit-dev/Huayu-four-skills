/* ── Global search index ─────────────────────────────────────────
   One flat, grouped index over every content bank so the command
   palette (Ctrl+K) can jump anywhere. Tone marks are stripped for
   pinyin matching; the index is built once per session. */

import {
  CHARACTERS_DATABASE,
  READING_STORIES,
  LISTENING_EXERCISES,
  SPEAKING_PHRASES,
  CHENGYU_DATABASE,
  TONGUE_TWISTERS,
  RADICALS,
  YONG_PRINCIPLES,
} from '../data/chineseData';
import { SkillTab } from '../types';

export type SearchKind =
  | 'character'
  | 'story'
  | 'listening'
  | 'speaking'
  | 'chengyu'
  | 'tongueTwister'
  | 'radical'
  | 'stroke';

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  /** Primary display text (hanzi) */
  title: string;
  /** Short secondary line (pinyin or english) */
  subtitle: string;
  /** Pre-lowered haystack: title + pinyin + english */
  haystack: string;
  /** Where this item lives */
  tab: SkillTab;
  /** Payload handed to the jump action */
  ref: string;
  /** Difficulty / level chip when known */
  level?: string;
}

/** Collapse tone marks + lowercase so "ni hao" matches "Nǐ hǎo". */
export function normalizePinyin(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const KIND_META: Record<SearchKind, { label: string; icon: string }> = {
  character: { label: 'Character 写', icon: '字' },
  story: { label: 'Story 读', icon: '读' },
  listening: { label: 'Listening 听', icon: '听' },
  speaking: { label: 'Phrase 说', icon: '说' },
  chengyu: { label: 'Chengyu 读', icon: '成' },
  tongueTwister: { label: 'Tongue twister 说', icon: '绕' },
  radical: { label: 'Radical 写', icon: '部' },
  stroke: { label: 'Stroke 写', icon: '永' },
};

export function kindLabel(kind: SearchKind): string {
  return KIND_META[kind].label;
}

export function kindIcon(kind: SearchKind): string {
  return KIND_META[kind].icon;
}

let cachedIndex: SearchDoc[] | null = null;

/** Build (once) and return the global search index. */
export function getSearchIndex(): SearchDoc[] {
  if (cachedIndex) return cachedIndex;
  const docs: SearchDoc[] = [];

  for (const c of CHARACTERS_DATABASE) {
    docs.push({
      id: `character:${c.character}`,
      kind: 'character',
      title: c.character,
      subtitle: `${c.pinyin} · ${c.meaning}`,
      haystack: `${c.character} ${normalizePinyin(c.pinyin)} ${c.meaning.toLowerCase()} radical ${c.radical} hsk${c.hskLevel}`,
      tab: 'writing',
      ref: c.character,
      level: `HSK ${c.hskLevel}`,
    });
  }

  for (const s of READING_STORIES) {
    docs.push({
      id: `story:${s.id}`,
      kind: 'story',
      title: s.titleChinese,
      subtitle: s.titleEnglish,
      haystack: `${s.titleChinese} ${normalizePinyin(s.titlePinyin)} ${s.titleEnglish.toLowerCase()} hsk${s.hskLevel}`,
      tab: 'reading',
      ref: s.id,
      level: `HSK ${s.hskLevel}`,
    });
  }
  for (const ex of LISTENING_EXERCISES) {
    docs.push({
      id: `listening:${ex.id}`,
      kind: 'listening',
      title: ex.chinese.length > 18 ? `${ex.chinese.slice(0, 18)}…` : ex.chinese,
      subtitle: ex.english.length > 60 ? `${ex.english.slice(0, 60)}…` : ex.english,
      haystack: `${ex.chinese} ${normalizePinyin(ex.pinyin)} ${ex.english.toLowerCase()}`,
      tab: 'listening',
      ref: ex.id,
    });
  }

  for (const p of SPEAKING_PHRASES) {
    docs.push({
      id: `speaking:${p.id}`,
      kind: 'speaking',
      title: p.chinese,
      subtitle: p.english,
      haystack: `${p.chinese} ${normalizePinyin(p.pinyin)} ${p.english.toLowerCase()} ${p.category.toLowerCase()}`,
      tab: 'speaking',
      ref: p.id,
      level: p.difficulty,
    });
  }

  for (const cy of CHENGYU_DATABASE) {
    docs.push({
      id: `chengyu:${cy.id}`,
      kind: 'chengyu',
      title: cy.idiom,
      subtitle: cy.figurative,
      haystack: `${cy.idiom} ${normalizePinyin(cy.pinyin)} ${cy.figurative.toLowerCase()} ${cy.literal.toLowerCase()}`,
      tab: 'reading',
      ref: cy.id,
      level: cy.difficulty,
    });
  }

  for (const tt of TONGUE_TWISTERS) {
    docs.push({
      id: `twister:${tt.id}`,
      kind: 'tongueTwister',
      title: tt.title,
      subtitle: tt.focus,
      haystack: `${tt.title} ${normalizePinyin(tt.chinese)} ${tt.english.toLowerCase()} ${tt.focus.toLowerCase()}`,
      tab: 'speaking',
      ref: tt.id,
      level: tt.difficulty,
    });
  }

  for (const r of RADICALS) {
    docs.push({
      id: `radical:${r.radical}`,
      kind: 'radical',
      title: r.radical,
      subtitle: `${r.pinyin} · ${r.meaning}`,
      haystack: `${r.radical} ${normalizePinyin(r.pinyin)} ${r.meaning.toLowerCase()} radical`,
      tab: 'writing',
      ref: r.radical,
    });
  }

  for (const y of YONG_PRINCIPLES) {
    docs.push({
      id: `stroke:${y.id}`,
      kind: 'stroke',
      title: `${y.strokeType} — ${y.name}`,
      subtitle: y.metaphor,
      haystack: `${y.strokeType} ${normalizePinyin(y.pinyin)} ${y.name.toLowerCase()} yong 永 principle`,
      tab: 'writing',
      ref: y.strokeType,
    });
  }

  cachedIndex = docs;
  return docs;
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
}

/**
 * Lightweight substring scorer: exact hanzi > prefix > substring;
 * tone-insensitive pinyin words are AND-matched as a fallback.
 */
export function searchContent(query: string, limit = 24): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const lowered = q.toLowerCase();
  const norm = normalizePinyin(q);
  const hits: SearchHit[] = [];

  for (const doc of getSearchIndex()) {
    let score = 0;
    if (doc.title === q) score = 100;
    else if (doc.title.startsWith(q)) score = 80;
    else if (doc.title.includes(q)) score = 60;
    else if (norm && doc.haystack.includes(norm)) score = 45;
    else if (lowered && doc.haystack.includes(lowered)) score = 40;
    else {
      const words = norm.split(' ').filter(Boolean);
      if (words.length > 1 && words.every((w) => doc.haystack.includes(w))) score = 30;
    }
    if (score > 0) hits.push({ doc, score });
  }

  return hits
    .sort((a, b) => b.score - a.score || a.doc.title.length - b.doc.title.length)
    .slice(0, limit);
}

