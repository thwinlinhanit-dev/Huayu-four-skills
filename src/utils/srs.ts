/* Real spaced-repetition scheduler (SM-2 flavored) with a persistent deck.

   Deck lives in its own schema-versioned localStorage key so it can grow to
   thousands of cards without touching the progress/streak document.

   Ratings:  again → back to <10min;  hard → ~1.2× current;  good → current × ease;
   easy → current × ease × 1.3 (min 3d on first success). Default ease 2.5. */

import { dayKey } from './streaks';

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';
export type SrsKind = 'char' | 'word' | 'sentence' | 'tone';

export interface SrsCard {
  id: string;
  kind: SrsKind;
  front: string;
  pinyin?: string;
  meaning?: string;
  hsk?: number;
  addedAt: number;
  due: number;      // timestamp ms
  interval: number; // days
  reps: number;
  lapses: number;
  ease: number;
}

interface DayStats {
  reviews: number;
  again: number;
  good: number;
  easy: number;
}

export interface SrsDeck {
  version: 1;
  cards: Record<string, SrsCard>;
  stats: Record<string, DayStats>;
}

const KEY = 'huayu_srs_deck_v1';
const MAX_INTERVAL = 3650;
const DAY_MS = 86_400_000;

export function emptyDeck(): SrsDeck {
  return { version: 1, cards: {}, stats: {} };
}

function migrate(raw: any): SrsDeck {
  if (!raw || typeof raw !== 'object' || typeof raw.cards !== 'object') return emptyDeck();
  const cards: Record<string, SrsCard> = {};
  for (const [id, c] of Object.entries(raw.cards || {})) {
    const card = c as Partial<SrsCard>;
    cards[id] = {
      id,
      kind: card.kind ?? 'char',
      front: card.front ?? id,
      pinyin: card.pinyin,
      meaning: card.meaning,
      hsk: card.hsk,
      addedAt: card.addedAt ?? Date.now(),
      due: card.due ?? Date.now(),
      interval: card.interval ?? 0,
      reps: card.reps ?? 0,
      lapses: card.lapses ?? 0,
      ease: card.ease ?? 2.5,
    };
  }
  return { version: 1, cards, stats: typeof raw.stats === 'object' ? raw.stats : {} };
}

export function loadDeck(): SrsDeck {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw)) : emptyDeck();
  } catch {
    return emptyDeck();
  }
}

export function saveDeck(deck: SrsDeck) {
  try {
    localStorage.setItem(KEY, JSON.stringify(deck));
  } catch (e) {
    console.error('saveDeck:', e);
  }
}

/** Add cards (upsert preserves scheduling when the id already exists). */
export function addCards(kind: SrsKind, entries: { id: string; front: string; pinyin?: string; meaning?: string; hsk?: number }[]): SrsDeck {
  const deck = loadDeck();
  for (const item of entries) {
    if (deck.cards[item.id]) continue; // keep existing scheduling
    deck.cards[item.id] = {
      ...item,
      kind,
      addedAt: Date.now(),
      due: Date.now(),
      interval: 0,
      reps: 0,
      lapses: 0,
      ease: 2.5,
    };
  }
  saveDeck(deck);
  return deck;
}

/** Seed the deck from a character/word bank (skips already-scheduled cards). */
export function seedDeckFromCharacters(chars: { character: string; pinyin: string; meaning: string; hsk: number }[]) {
  const entries = chars.map((c) => ({ id: `char:${c.character}`, front: c.character, pinyin: c.pinyin, meaning: c.meaning, hsk: c.hsk }));
  return addCards('char', entries);
}

/** Remove a card from the deck (used to un-mine sentences/words). Returns true when removed. */
export function removeCard(id: string): boolean {
  const deck = loadDeck();
  if (!deck.cards[id]) return false;
  delete deck.cards[id];
  saveDeck(deck);
  return true;
}

export function reviewCard(id: string, rating: SrsRating, now: number = Date.now()): SrsDeck {
  const deck = loadDeck();
  const card = deck.cards[id];
  if (!card) return deck;

  const today = dayKey(new Date(now));
  const st = (deck.stats[today] = deck.stats[today] || { reviews: 0, again: 0, good: 0, easy: 0 });
  st.reviews++;

  const ease = card.ease > 0 ? card.ease : 2.5;
  const round = (n: number) => Math.min(MAX_INTERVAL, Math.max(0, Math.round(n)));

  switch (rating) {
    case 'again':
      card.due = now + 10 * 60_000; // 10 minutes
      card.interval = 0;
      card.reps = 0;
      card.lapses += 1;
      card.ease = Math.max(1.3, ease - 0.2);
      st.again++;
      break;
    case 'hard':
      card.interval = card.interval === 0 ? 1 : round(card.interval * 1.2);
      card.due = now + card.interval * DAY_MS;
      card.reps += 1;
      card.ease = Math.max(1.3, ease - 0.15);
      break;
    case 'good':
      card.interval = card.interval === 0 ? 1 : round(card.interval * ease);
      card.due = now + card.interval * DAY_MS;
      card.reps += 1;
      card.ease = ease;
      st.good++;
      break;
    case 'easy':
      card.interval = card.interval === 0 ? 3 : round(card.interval * ease * 1.3);
      card.due = now + card.interval * DAY_MS;
      card.reps += 1;
      card.ease = Math.min(3.2, ease + 0.15);
      st.easy++;
      break;
  }
  saveDeck(deck);
  return deck;
}

/* ── Stats & queues ──────────────────────────────────────────── */

export interface SrsStats {
  total: number;
  due: number;
  newCount: number;
  learning: number;
  reviewsToday: number;
  againToday: number;
  byKind: Record<SrsKind, number>;
}

export function getSrsStats(now: number = Date.now()): SrsStats {
  const deck = loadDeck();
  const today = dayKey(new Date(now));
  const byKind: Record<SrsKind, number> = { char: 0, word: 0, sentence: 0, tone: 0 };
  let due = 0;
  let newCount = 0;
  let learning = 0;
  for (const card of Object.values(deck.cards)) {
    byKind[card.kind] += 1;
    if (card.due <= now) {
      due++;
      if (card.reps === 0) newCount++;
      else if (card.reps < 3) learning++;
    }
  }
  const st = deck.stats[today];
  return {
    total: Object.keys(deck.cards).length,
    due,
    newCount,
    learning,
    reviewsToday: st?.reviews ?? 0,
    againToday: st?.again ?? 0,
    byKind,
  };
}

/** Ordered review queue: due first (by due time), then never-seen cards. */
export function getReviewQueue(limit = 150, now: number = Date.now()): SrsCard[] {
  const deck = loadDeck();
  const cards = Object.values(deck.cards);
  const due = cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due);
  const fresh = cards.filter((c) => c.due > now && c.reps === 0).sort((a, b) => a.addedAt - b.addedAt);
  return [...due, ...fresh].slice(0, limit);
}

export function getDueCount(now: number = Date.now()): number {
  return getSrsStats(now).due;
}

/** Snapshot of card due dates (for stats/insights). */
export function getDeckSnapshot(): { card: SrsCard; daysToDue: number }[] {
  const deck = loadDeck();
  const now = Date.now();
  return Object.values(deck.cards)
    .map((card) => ({ card, daysToDue: Math.round((card.due - now) / DAY_MS) }))
    .sort((a, b) => a.card.due - b.card.due)
    .slice(0, 500);
}