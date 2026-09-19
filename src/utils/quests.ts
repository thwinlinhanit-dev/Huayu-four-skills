/* ── Daily quests ────────────────────────────────────────────────
   Five reset-per-day quests derived from the real activity log in
   the unified progress store. Claiming pays XP exactly once per
   day per quest. */

import { loadProgress, saveProgress, addXp } from './progressStore';

/** YYYY-MM-DD for a given date (local timezone) — mirrors streaks.dayKey */
function keyOf(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type QuestId =
  | 'srs_reviews'
  | 'srs_new'
  | 'listening'
  | 'writing'
  | 'reading';

export interface QuestDef {
  id: QuestId;
  title: string;
  chinese: string;
  /** Event types counted from the activity log */
  eventTypes: string[];
  target: number;
  xp: number;
  icon: string;
}

export const QUESTS: QuestDef[] = [
  { id: 'srs_reviews', title: 'Review 10 cards', chinese: '复习十张', eventTypes: ['srs_review'], target: 10, xp: 30, icon: '🧠' },
  { id: 'srs_new', title: 'Learn 3 new cards', chinese: '新学三张', eventTypes: ['srs_mastered'], target: 3, xp: 20, icon: '🌱' },
  { id: 'listening', title: 'Answer 5 listening questions', chinese: '听力五题', eventTypes: ['listening_answer'], target: 5, xp: 25, icon: '👂' },
  { id: 'writing', title: 'Write 1 character', chinese: '写一字', eventTypes: ['character_mastered', 'hanzi_written'], target: 1, xp: 15, icon: '✍️' },
  { id: 'reading', title: 'Read a story', chinese: '读一则', eventTypes: ['story_completed'], target: 1, xp: 25, icon: '📖' },
];

export interface QuestState {
  def: QuestDef;
  progress: number;
  claimed: boolean;
  complete: boolean;
}

/** Today's quest progress + claim state (read-only). */
export function getQuestStates(): { states: QuestState[]; allDone: boolean } {
  const p = loadProgress();
  const today = keyOf();
  const counts = new Map<QuestId, number>();

  for (const e of p.activity) {
    if (keyOf(new Date(e.ts)) !== today) continue;
    for (const q of QUESTS) {
      if (q.eventTypes.includes(e.type)) {
        counts.set(q.id, (counts.get(q.id) || 0) + 1);
      }
    }
  }

  const claimedToday = p.questClaims?.[today] ?? {};
  const states: QuestState[] = QUESTS.map((def) => {
    const progress = Math.min(def.target, counts.get(def.id) || 0);
    return {
      def,
      progress,
      claimed: !!claimedToday[def.id],
      complete: progress >= def.target,
    };
  });

  return { states, allDone: states.every((s) => s.complete) };
}

/** Claim a completed quest's XP (idempotent per day). Returns XP granted (0 if already claimed). */
export function claimQuest(id: QuestId): number {
  const { states } = getQuestStates();
  const state = states.find((s) => s.def.id === id);
  if (!state || !state.complete || state.claimed) return 0;

  const p = loadProgress();
  const today = keyOf();
  p.questClaims = p.questClaims || {};
  p.questClaims[today] = { ...(p.questClaims[today] || {}), [id]: true };
  p.activity.push({ ts: Date.now(), type: 'quest_claimed', ref: id, value: state.def.xp });
  saveProgress(p);
  addXp(state.def.xp, 'quest_xp', id);
  return state.def.xp;
}
