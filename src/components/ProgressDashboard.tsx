import React from 'react';
import {
  Flame,
  Star,
  Sparkles,
  Zap,
  TrendingUp,
  Brain,
  Award,
  Download,
  Upload,
  Trash2,
  Volume2,
  Headphones,
  History,
} from 'lucide-react';
import { SkillTab } from '../types';
import {
  loadProgress,
  getStreak,
  levelProgress,
  exportProgress,
  importProgress,
  ActivityEvent,
} from '../utils/progressStore';
import { getSrsStats } from '../utils/srs';
import { CHARACTERS_DATABASE } from '../data/chineseData';
import { PlacementQuiz } from './PlacementQuiz';

interface ProgressDashboardProps {
  onNavigateSkill?: (tab: SkillTab) => void;
}

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const EVENT_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  srs_review: { icon: Brain, color: 'text-amber-500', label: 'SRS review' },
  character_mastered: { icon: Award, color: 'text-emerald-500', label: 'Mastered' },
  listening_answer: { icon: Headphones, color: 'text-sky-500', label: 'Listening drill' },
  practice_day: { icon: Flame, color: 'text-orange-500', label: 'Practice day' },
  placement: { icon: TrendingUp, color: 'text-teal-500', label: 'Placement' },
};

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ onNavigateSkill }) => {
  const [tick, setTick] = React.useState<number>(0);
  const [showPlacementQuiz, setShowPlacementQuiz] = React.useState<boolean>(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = window.setInterval(() => setTick((v) => v + 1), 30000);
    return () => window.clearInterval(t);
  }, []);

  const p = loadProgress();
  const streak = getStreak();
  const lp = levelProgress(); // { level, into, need }
  const pct = Math.min(100, Math.round((lp.into / lp.need) * 100));
  const srs = getSrsStats();
  const activeSet = new Set(p.streak.activeDates);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      key,
      active: activeSet.has(key),
      isToday: i === 6,
      weekday: d.getDay(),
    };
  });

  const pinyinOf = (char: string): string =>
    CHARACTERS_DATABASE.find((c) => c.character === char)?.pinyin ?? '';

  const handleExport = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `huayu-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importProgress(String(reader.result));
      if (ok) {
        setTick((v) => v + 1);
      } else {
        window.alert('Import failed — the file does not look like a Huayu progress backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Reset ALL progress? This cannot be undone (export a backup first).')) {
      try {
        localStorage.removeItem('huayu_progress_v1');
        localStorage.removeItem('huayu_srs_deck_v1');
      } catch {
        /* ignore */
      }
      setTick((v) => v + 1);
    }
  };

  return (
    <div className="space-y-6" data-tick={tick}>
      {/* Level + streak banner */}
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-5 justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Learner level</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-4xl font-black text-slate-100 leading-none">{lp.level}</span>
              <span className="text-xs text-slate-400 mb-1">
                {lp.into} / {lp.need} XP to level {lp.level + 1}
              </span>
            </div>
            <div className="mt-3 h-2 w-56 max-w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3">
              <Flame className="w-6 h-6 text-orange-500" />
              <div>
                <p className="text-xl font-black text-orange-400 leading-none">{streak.current}</p>
                <p className="text-[10px] text-slate-400">day streak</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/50 px-4 py-3">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xl font-black text-slate-100 leading-none">{streak.longest}</p>
                <p className="text-[10px] text-slate-400">best streak</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Sparkles} color="text-amber-500" label="Due now" value={srs.due} hint="SRS reviews" onClick={() => onNavigateSkill?.('reading')} />
        <StatCard icon={Brain} color="text-rose-500" label="Cards learned" value={srs.total} hint="in memory deck" />
        <StatCard icon={Award} color="text-emerald-500" label="Mastered" value={p.masteredCharacters.length} hint="characters" onClick={() => onNavigateSkill?.('writing')} />
        <StatCard icon={Headphones} color="text-sky-500" label="Listening" value={`${p.listeningCorrect}/${p.listeningTotal}`} hint="answers correct" onClick={() => onNavigateSkill?.('listening')} />
      </section>

      {/* Activity week + placement */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-500" /> This week
          </h3>
          <div className="flex gap-2.5">
            {week.map((d) => (
              <div key={d.key} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-full h-10 rounded-xl border transition-colors ${
                    d.active ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-slate-800/40 border-slate-800'
                  }`}
                  title={d.active ? 'Practiced' : 'No practice'}
                >
                  {d.active && (
                    <div className="w-full h-full flex items-center justify-center text-emerald-400 text-xs">✓</div>
                  )}
                </div>
                <span className={`text-[10px] ${d.isToday ? 'text-slate-200 font-bold' : 'text-slate-500'}`}>
                  {WEEKDAY_LABELS[d.weekday]}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-teal-500" /> Placement
          </h3>
          {p.placement && !showPlacementQuiz ? (
            <div>
              <p className="text-3xl font-black text-slate-100">HSK {p.placement.hsk}</p>
              <p className="text-xs text-slate-400 mt-1">
                Taken {new Date(p.placement.takenAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => setShowPlacementQuiz(true)}
                className="mt-3 h-8 px-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-xs text-slate-200 transition-colors cursor-pointer"
              >
                Retake quiz
              </button>
            </div>
          ) : (
            <PlacementQuiz onComplete={() => setShowPlacementQuiz(false)} onNavigateSkill={onNavigateSkill} />
          )}
        </div>
      </section>

      {/* Mastered characters */}
      {p.masteredCharacters.length > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-4">
            Mastered characters ({p.masteredCharacters.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {p.masteredCharacters.map((char) => (
              <button
                key={char}
                onClick={() => onNavigateSkill?.('writing')}
                title={pinyinOf(char)}
                className="group relative w-11 h-11 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
              >
                <span className="text-lg font-serif font-black text-emerald-300">{char}</span>
                {pinyinOf(char) && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 whitespace-nowrap pointer-events-none">
                    {pinyinOf(char)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity + data management */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" /> Recent activity
          </h3>
          {p.activity.length === 0 ? (
            <p className="text-xs text-slate-500">No activity yet — complete a lesson to see it here.</p>
          ) : (
            <ul className="space-y-2.5">
              {p.activity.slice(-8).reverse().map((e: ActivityEvent, i: number) => {
                const meta = EVENT_META[e.type] ?? { icon: Zap, color: 'text-slate-400', label: e.type };
                const Icon = meta.icon;
                return (
                  <li key={`${e.ts}-${i}`} className="flex items-center gap-3 text-xs">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                    <span className="text-slate-300">{meta.label}</span>
                    {e.ref && <span className="text-slate-500 truncate">{e.ref}</span>}
                    <span className="ml-auto text-slate-600 shrink-0">{timeAgo(e.ts)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400" /> Data
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-xs text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export backup
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-xs text-slate-200 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset all
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = '';
              }}
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-3">
            Progress lives in your browser. Export a backup before clearing site data.
          </p>
        </div>
      </section>
    </div>
  );
};

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, color, label, value, hint, onClick }) => {
  const cls =
    'rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left transition-colors' +
    (onClick ? ' hover:border-slate-700 cursor-pointer' : '');
  const body = (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[11px] uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-100 leading-none">{value}</p>
      {hint && <p className="text-[10px] text-slate-500 mt-1">{hint}</p>}
    </>
  );
  return onClick ? (
    <button onClick={onClick} className={cls}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
};
