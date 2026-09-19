/**
 * Source loaders for the HSK generator. Everything is cached under .cache/ so the
 * generator can run offline after the first pass.
 *
 *   HSK level + word list  → glxxyz/hskhsk.com (official HSK 2012 lists)
 *   pinyin / radical / def → skishore/makemeahanzi dictionary.txt
 *   stroke names + order   → cnchar-order package data (6,939 characters)
 *   stroke count / medians → hanzi-writer-data CDN (same files the app uses)
 */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CACHE = resolve(process.cwd(), '.cache');
const HSK_BASE = 'https://raw.githubusercontent.com/glxxyz/hskhsk.com/main/data/lists';
const MAKEMEAHANZI = 'https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt';
const CNCHAR_ORDER = 'https://cdn.jsdelivr.net/npm/cnchar-order@3.2.6/cnchar.order.min.js';
const HANZI_CDN = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0';

mkdirSync(CACHE, { recursive: true });

async function download(url: string): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw new Error(`unreachable: ${url}`);
}

/** Fetch a remote file once and keep it in .cache/. */
export async function cached(name: string, url: string): Promise<string> {
  const file = resolve(CACHE, name);
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const text = await download(url);
  mkdirSync(resolve(file, '..'), { recursive: true });
  writeFileSync(file, text, 'utf8');
  return text;
}

export interface HskWord {
  word: string;
  numberedPinyin: string;
  pinyin: string;
  gloss: string;
  level: number;
}

/** Official HSK 2012 lists, levels 1-6 (word, numbered pinyin, gloss). */
export async function loadHskWords(levels: number[]): Promise<HskWord[]> {
  const out: HskWord[] = [];
  for (const level of levels) {
    const raw = await cached(`hsk-l${level}.txt`, `${HSK_BASE}/HSK%20Official%20With%20Definitions%202012%20L${level}.txt`);
    for (const line of raw.split(/\r?\n/)) {
      const cols = line.split('\t');
      if (cols.length < 5 || !cols[1]) continue;
      out.push({
        word: cols[1].trim(),
        numberedPinyin: cols[2].trim(),
        pinyin: cols[3].trim(),
        gloss: cols[4].trim(),
        level,
      });
    }
  }
  return out;
}

export interface HanziRecord {
  character: string;
  definition?: string;
  pinyin: string[];
  radical?: string;
}

/** makemeahanzi gives radical + short definition for ~9k characters. */
export async function loadMakeMeAHanzi(): Promise<Map<string, HanziRecord>> {
  const raw = await cached('makemeahanzi.txt', MAKEMEAHANZI);
  const map = new Map<string, HanziRecord>();
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line) as HanziRecord;
      if (rec.character && Array.from(rec.character).length === 1) map.set(rec.character, rec);
    } catch {
      // ignore malformed lines
    }
  }
  return map;
}

export interface StrokeTableEntry {
  shape: string;
  type: string;
  foldCount: string;
  name: string;
  letter: string;
}

/** cnchar-order: per-character stroke-order letter strings + the letter→name table. */
export async function loadCncharOrders(): Promise<{
  orders: Record<string, string>;
  strokeTable: Record<string, StrokeTableEntry>;
}> {
  const file = resolve(CACHE, 'cnchar.order.js');
  if (!existsSync(file)) writeFileSync(file, await download(CNCHAR_ORDER), 'utf8');
  const require = createRequire(import.meta.url);
  const mod = require(file) as { dict: { orders: Record<string, string>; strokeTable: Record<string, StrokeTableEntry> } };
  return mod.dict;
}

export interface HanziWriterData {
  strokes: string[];
  medians: number[][][];
}

/** hanzi-writer vectors (cached): authoritative stroke count + median polylines. */
export async function loadStrokeVectors(char: string): Promise<HanziWriterData | null> {
  try {
    const raw = await cached(`hanzi/${char}.json`, `${HANZI_CDN}/${encodeURIComponent(char)}.json`);
    return JSON.parse(raw) as HanziWriterData;
  } catch {
    return null;
  }
}
