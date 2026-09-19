/* ── Daily recap toast ───────────────────────────────────────────
   Fires once per calendar day (localStorage guard): a one-line
   summary of today's practice, e.g.
   "Day 12 streak · 34 reviews · 3 new characters". */

import { useEffect } from 'react';
import { getStreak, loadProgress } from '../utils/progressStore';
import { getSrsStats } from '../utils/srs';
import { pushToast } from '../components/ToastHost';

const GUARD_KEY = 'huayu_recap_day';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Count today's SRS review events from the activity log. */
function reviewsToday(): number {
  const today = todayKey();
  const p = loadProgress();
  return p.activity.filter((e) => {
    if (e.type !== 'srs_review' && e.type !== 'srs_mastered') return false;
    const d = new Date(e.ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return key === today;
  }).length;
}

function newCharactersToday(): number {
  const today = todayKey();
  const p = loadProgress();
  return p.activity.filter((e) => {
    if (e.type !== 'character_mastered') return false;
    const d = new Date(e.ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return key === today;
  }).length;
}

/**
 * Mount once (App root). On the first visit of each calendar day,
 * shows a streak/review/new-character recap toast.
 */
export function useDailyRecap(): void {
  useEffect(() => {
    let today = todayKey();
    try {
      if (localStorage.getItem(GUARD_KEY) === today) return;
    } catch {
      return; // storage unavailable → skip to avoid re-firing every render
    }

    const streak = getStreak().current;
    const srs = getSrsStats();
    const reviews = reviewsToday();
    const fresh = newCharactersToday();

    if (streak === 0 && reviews === 0 && fresh === 0 && srs.due === 0) {
      // Brand-new visitor: stay silent rather than nagging with zeroes
      try {
        localStorage.setItem(GUARD_KEY, today);
      } catch {
        /* ignore */
      }
      return;
    }

    const parts: string[] = [];
    if (streak > 0) parts.push(`Day ${streak} streak`);
    if (reviews > 0) parts.push(`${reviews} review${reviews === 1 ? '' : 's'}`);
    if (fresh > 0) parts.push(`${fresh} new character${fresh === 1 ? '' : 's'}`);
    if (srs.due > 0) parts.push(`${srs.due} due now`);

    pushToast({ message: parts.join(' · '), icon: '🔥', tone: 'default', duration: 6000 });
    try {
      localStorage.setItem(GUARD_KEY, today);
    } catch {
      /* ignore */
    }
  }, []);
}
