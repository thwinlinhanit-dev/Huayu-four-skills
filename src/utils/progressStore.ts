/* Unified, versioned local progress store.
   Consolidates the old ad-hoc localStorage keys (streaks, mastered characters,
   listening scores, XP) into ONE schema-versioned document with migrations,
   an event log, and full export/import. */

import { computeStreak, addActiveDate, dayKey, StreakResult } from './streaks';

export const SCHEMA_VERSION = 1;
const KEY = 'huayu_progress_v1';
const MAX_ACTIVITY = 3000;

export interface ActivityEvent {
  ts: number;
  type: string;
  ref?: string;
  value?: number;
}

export interface HuayuProgress {
  schema: number;
  createdAt: number;
  updatedAt: number;
  streak: {
    activeDates: string[]; // YYYY-MM-DD, ascending
    lastActive: string;
  };
  masteredCharacters: string[];
  listeningCorrect: number;
  listeningTotal: number;
  xp: number;
  placement: { hsk: 1 | 2 | 3 | 4 | 5 | 6; takenAt: number } | null;
  activity: ActivityEvent[];
  /** Medals granted exactly once (see utils/achievements.ts) */
  unlockedAchievements: { id: string; at: number }[];
  /** Story ids finished at least once (deduped) */
  storyCompletions: { storyId: string; at: number }[];
  /** questId → claimed, keyed by YYYY-MM-DD (see utils/quests.ts) */
  questClaims: Record<string, Record<string, boolean>>;
}

export function emptyProgress(): HuayuProgress {
  return {
    schema: SCHEMA_VERSION,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    streak: { activeDates: [], lastActive: '' },
    masteredCharacters: [],
    listeningCorrect: 0,
    listeningTotal: 0,
    xp: 0,
    placement: null,
    activity: [],
    unlockedAchievements: [],
    storyCompletions: [],
    questClaims: {},
  };
}

function migrate(raw: any): HuayuProgress {
  if (!raw || typeof raw !== 'object') return emptyProgress();
  const empty = emptyProgress();
  const p: HuayuProgress = {
    ...empty,
    ...raw,
    streak: { ...empty.streak, ...(raw.streak || {}) },
    activity: Array.isArray(raw.activity) ? raw.activity.slice(-MAX_ACTIVITY) : [],
    masteredCharacters: Array.isArray(raw.masteredCharacters) ? raw.masteredCharacters : [],
    unlockedAchievements: Array.isArray(raw.unlockedAchievements) ? raw.unlockedAchievements : [],
    storyCompletions: Array.isArray(raw.storyCompletions) ? raw.storyCompletions : [],
    questClaims: raw.questClaims && typeof raw.questClaims === 'object' ? raw.questClaims : {},
  };
  p.schema = SCHEMA_VERSION;
  return p;
}

/* ── Load / save ─────────────────────────────────────────────── */

export function loadProgress(): HuayuProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    return migrate(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: HuayuProgress): HuayuProgress {
  p.updatedAt = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch (e) {
    console.error('saveProgress:', e);
  }
  notify();
  return p;
}

/* ── Pub/sub so UI (Header streak, dashboard) can refresh ────── */

const listeners = new Set<() => void>();
export function onProgressChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function notify() {
  listeners.forEach((cb) => cb());
}

/* ── Streak ───────────────────────────────────────────────────── */

export function getStreak(): StreakResult {
  const p = loadProgress();
  return computeStreak(p.streak.activeDates);
}

/** Register practice for today (idempotent per day). Returns new streak. */
export function registerPractice(d: Date = new Date()): StreakResult {
  const p = loadProgress();
  const key = dayKey(d);
  const { activeDates, isNew } = addActiveDate(p.streak.activeDates, key);
  p.streak = { activeDates, lastActive: key };
  if (isNew) {
    p.activity.push({ ts: Date.now(), type: 'practice_day' });
  }
  saveProgress(p);
  return computeStreak(activeDates);
}

export function getActiveDates(): string[] {
  return loadProgress().streak.activeDates;
}

/* ── Mastering & XP ───────────────────────────────────────────── */

export function addMasteredCharacter(char: string): boolean {
  const p = loadProgress();
  if (p.masteredCharacters.includes(char)) return false;
  p.masteredCharacters = [...p.masteredCharacters, char];
  p.xp += 15;
  p.activity.push({ ts: Date.now(), type: 'character_mastered', ref: char, value: 15 });
  saveProgress(p);
  return true;
}

export function getMasteredCount(): number {
  return loadProgress().masteredCharacters.length;
}

export function addXp(amount: number, type: string, ref?: string): number {
  const p = loadProgress();
  p.xp += amount;
  p.activity.push({ ts: Date.now(), type, ref, value: amount });
  saveProgress(p);
  return p.xp;
}

export function recordEvent(type: string, ref?: string, value?: number) {
  const p = loadProgress();
  p.activity.push({ ts: Date.now(), type, ref, value });
  p.activity = p.activity.slice(-MAX_ACTIVITY);
  saveProgress(p);
}

/** Cumulative level = every FULL 100 XP advances one level (1-based). */
export function getLevel(xp: number = loadProgress().xp): number {
  return Math.floor(xp / 100) + 1;
}

export function levelProgress(xp: number = loadProgress().xp): { level: number; into: number; need: number } {
  const level = getLevel(xp);
  const base = (level - 1) * 100;
  return { level, into: xp - base, need: 100 };
}

/* ── Listening ────────────────────────────────────────────────── */

export function recordListening(correct: number, total: number) {
  if (total <= 0) return;
  const p = loadProgress();
  // Only count the most recent answer event
  p.listeningCorrect += correct;
  p.listeningTotal += total;
  p.activity.push({ ts: Date.now(), type: 'listening_answer', value: total - correct });
  saveProgress(p);
}

export function setPlacement(hsk: 1 | 2 | 3 | 4 | 5 | 6) {
  const p = loadProgress();
  p.placement = { hsk, takenAt: Date.now() };
  p.xp += 20;
  p.activity.push({ ts: Date.now(), type: 'placement', ref: `HSK${hsk}`, value: 20 });
  saveProgress(p);
}

/* ── Stories ───────────────────────────────────────────────────── */

/** Mark a story as finished (idempotent). Returns true when it's the first completion. */
export function recordStoryCompletion(storyId: string): boolean {
  const p = loadProgress();
  if (p.storyCompletions.some((s) => s.storyId === storyId)) return false;
  p.storyCompletions.push({ storyId, at: Date.now() });
  saveProgress(p);
  return true;
}

/* ── Export / import (backup & cross-device) ──────────────────── */

export function exportProgress(): string {
  return JSON.stringify(loadProgress(), null, 2);
}

export function importProgress(json: string): boolean {
  try {
    const parsed = migrate(JSON.parse(json));
    saveProgress(parsed);
    return true;
  } catch (e) {
    console.error('importProgress:', e);
    return false;
  }
}