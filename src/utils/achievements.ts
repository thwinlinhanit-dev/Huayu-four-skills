/* ── Evidence-based achievements ─────────────────────────────────
   Medals are unlocked by *measured* milestones (streak length, SRS
   volume, listening accuracy, stories read) — never arbitrary. Each
   achievement carries an XP reward granted exactly once. */

import { loadProgress, saveProgress, addXp, recordEvent } from './progressStore';
import { getSrsStats } from './srs';

export interface AchievementDef {
  id: string;
  title: string;
  chinese: string;
  description: string;
  /** Emoji shown on the medal */
  icon: string;
  xp: number;
  /** 0..1 progress toward unlock (null when live-measured only) */
  progress: (ctx: AchievementContext) => number | null;
}

export interface AchievementContext {
  streakCurrent: number;
  masteredCount: number;
  xp: number;
  srsTotal: number;
  listeningCorrect: number;
  listeningTotal: number;
  storiesCompleted: number;
  placementHsk: number | null;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-steps', title: 'First Steps', chinese: '第一步', description: 'Practice on your first day', icon: '🌱', xp: 10, progress: (c) => clamp01(c.streakCurrent >= 1 ? 1 : 0) },
  { id: 'week-streak', title: 'Seven Sunrises', chinese: '七日', description: 'Practice 7 days in a row', icon: '🔥', xp: 50, progress: (c) => clamp01(c.streakCurrent / 7) },
  { id: 'month-streak', title: 'Iron Habit', chinese: '铁习惯', description: 'Practice 30 days in a row', icon: '🏔️', xp: 200, progress: (c) => clamp01(c.streakCurrent / 30) },
  { id: 'century-streak', title: 'Century Streak', chinese: '百日', description: 'Practice 100 days in a row', icon: '🐉', xp: 500, progress: (c) => clamp01(c.streakCurrent / 100) },
  { id: 'first-mastered', title: 'First Character', chinese: '初字', description: 'Master your first character', icon: '✍️', xp: 15, progress: (c) => clamp01(c.masteredCount >= 1 ? 1 : 0) },
  { id: 'twenty-mastered', title: 'Radical Scholar', chinese: '部首学者', description: 'Master 20 characters', icon: '📚', xp: 80, progress: (c) => clamp01(c.masteredCount / 20) },
  { id: 'fifty-mastered', title: 'Character Collector', chinese: '字库', description: 'Master 50 characters', icon: '🏺', xp: 150, progress: (c) => clamp01(c.masteredCount / 50) },
  { id: 'first-review', title: 'Memory Spark', chinese: '记忆火花', description: 'Complete your first SRS review', icon: '⚡', xp: 10, progress: (c) => clamp01(c.srsTotal > 0 ? 1 : 0) },
  { id: 'fifty-reviews', title: 'Review Grinder', chinese: '复习者', description: '50 cards in your memory deck', icon: '🧠', xp: 60, progress: (c) => clamp01(c.srsTotal / 50) },
  { id: 'two-hundred-reviews', title: 'Long-Term Memory', chinese: '长期记忆', description: '200 cards in your memory deck', icon: '🌟', xp: 150, progress: (c) => clamp01(c.srsTotal / 200) },
  { id: 'listener-10', title: 'Keen Ear', chinese: '顺风耳', description: 'Answer 10 listening questions', icon: '👂', xp: 25, progress: (c) => clamp01(c.listeningTotal / 10) },
  { id: 'sharp-listener', title: 'Sharp Listener', chinese: '听力达人', description: '80%+ accuracy over 25+ listening answers', icon: '🎧', xp: 75, progress: (c) => (c.listeningTotal < 25 ? clamp01(c.listeningTotal / 25) : clamp01(c.listeningCorrect / c.listeningTotal / 0.8)) },
  { id: 'story-first', title: 'Story Time', chinese: '读故事', description: 'Finish your first graded story', icon: '📖', xp: 20, progress: (c) => clamp01(c.storiesCompleted >= 1 ? 1 : 0) },
  { id: 'story-five', title: 'Bookworm', chinese: '书虫', description: 'Finish 5 graded stories', icon: '🐛', xp: 60, progress: (c) => clamp01(c.storiesCompleted / 5) },
  { id: 'placed', title: 'Know Thyself', chinese: '知己', description: 'Complete the placement quiz', icon: '🧭', xp: 20, progress: (c) => clamp01(c.placementHsk !== null ? 1 : 0) },
  { id: 'level-5', title: 'Rising Star', chinese: '新星', description: 'Reach learner level 5 (500 XP)', icon: '🌠', xp: 100, progress: (c) => clamp01(c.xp / 500) },
  /* __MORE_ACHIEVEMENTS__ */
];

export interface AchievementState {
  def: AchievementDef;
  unlockedAt: number | null;
  /** 0..1 progress, or null when live-measured only */
  progress: number | null;
}

/** Current unlock state for every achievement (read-only, no side effects). */
export function getAchievementStates(): AchievementState[] {
  const p = loadProgress();
  const unlocked = new Map(p.unlockedAchievements.map((u) => [u.id, u.at]));
  const srs = getSrsStats();
  const ctx: AchievementContext = {
    streakCurrent: computeStreakCurrent(p.streak.activeDates),
    masteredCount: p.masteredCharacters.length,
    xp: p.xp,
    srsTotal: srs.total,
    listeningCorrect: p.listeningCorrect,
    listeningTotal: p.listeningTotal,
    storiesCompleted: p.storyCompletions.length,
    placementHsk: p.placement?.hsk ?? null,
  };

  return ACHIEVEMENTS.map((def) => ({
    def,
    unlockedAt: unlocked.get(def.id) ?? null,
    progress: def.progress(ctx),
  }));
}

/* Local streak helpers — avoid an import cycle with streaks.ts */
const DAY_MS = 86_400_000;

function keyOfDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStreakCurrent(activeDates: string[]): number {
  const set = new Set(activeDates);
  const cursor = new Date();
  if (!set.has(keyOfDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  while (set.has(keyOfDate(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return current;
}

export interface UnlockResult {
  newlyUnlocked: AchievementDef[];
  xpAwarded: number;
}

/**
 * Unlock any achievements whose criteria are now met (idempotent).
 * Awards XP once per achievement and pushes activity events.
 */
export function syncAchievements(): UnlockResult {
  const before = loadProgress();
  const already = new Set(before.unlockedAchievements.map((u) => u.id));
  const states = getAchievementStates();
  const newlyUnlocked: AchievementDef[] = [];
  let xpAwarded = 0;

  for (const s of states) {
    if (already.has(s.def.id)) continue;
    if (s.progress !== null && s.progress >= 1) {
      newlyUnlocked.push(s.def);
      xpAwarded += s.def.xp;
    }
  }

  if (newlyUnlocked.length > 0) {
    const p = loadProgress();
    for (const def of newlyUnlocked) {
      p.unlockedAchievements.push({ id: def.id, at: Date.now() });
      recordEvent('achievement', def.id, def.xp);
    }
    if (xpAwarded > 0) addXp(xpAwarded, 'achievement_bonus');
    saveProgress(p);
  }

  return { newlyUnlocked, xpAwarded };
}


