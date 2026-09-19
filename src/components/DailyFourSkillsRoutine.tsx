import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Award,
  Sparkles,
  Flame,
  PenTool,
  Headphones,
  Mic,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SkillTab } from '../types';

interface DailyFourSkillsRoutineProps {
  onNavigateSkill: (tab: SkillTab) => void;
  onSelectCharacterToWrite?: (char: string) => void;
  onPractice?: () => void;
}

interface RoutineTask {
  id: string;
  skill: SkillTab;
  title: string;
  chinese: string;
  rewardExp: number;
  completed: boolean;
  desc: string;
}

export const DailyFourSkillsRoutine: React.FC<DailyFourSkillsRoutineProps> = ({
  onNavigateSkill,
  onSelectCharacterToWrite,
  onPractice,
}) => {
  const todayKey = new Date().toISOString().slice(0, 10);

  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`huayu_daily_${todayKey}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dailyTasks: RoutineTask[] = [
    {
      id: 'task-write',
      skill: 'writing',
      title: 'Character Precision Tracing',
      chinese: '写 · 每日楷书一字 (覆 / 永)',
      rewardExp: 25,
      completed: completedTasks.includes('task-write'),
      desc: 'Trace 1 character following correct stroke order in the interactive canvas or Tian Zi Ge worksheet.',
    },
    {
      id: 'task-listen',
      skill: 'listening',
      title: 'Acoustic Tone & Speed Ramp',
      chinese: '听 · 辩音变速训练',
      rewardExp: 25,
      completed: completedTasks.includes('task-listen'),
      desc: 'Listen to 1 tone pitch curve or practice 1 speed-ramped listening sentence.',
    },
    {
      id: 'task-speak',
      skill: 'speaking',
      title: 'Shadowing & Tone Pitch Drill',
      chinese: '说 · 跟读跟练打分',
      rewardExp: 25,
      completed: completedTasks.includes('task-speak'),
      desc: 'Record your voice in the Shadowing player or converse with the AI conversational tutor.',
    },
    {
      id: 'task-read',
      skill: 'reading',
      title: 'Graded Reading & Vocab Mining',
      chinese: '读 · 课文分级精读',
      rewardExp: 25,
      completed: completedTasks.includes('task-read'),
      desc: 'Read 1 short HSK story or inspect 3 characters in the Smart Text Pinyinizer.',
    },
  ];

  const handleToggleTask = (id: string) => {
    let updated: string[];
    if (completedTasks.includes(id)) {
      updated = completedTasks.filter((t) => t !== id);
    } else {
      updated = [...completedTasks, id];
      if (updated.length === 4) {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      }
    }
    setCompletedTasks(updated);
    try {
      localStorage.setItem(`huayu_daily_${todayKey}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (updated.length > 0 && onPractice) {
      onPractice();
    }
  };

  const completedCount = dailyTasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg shadow-slate-700/25">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Daily Routine
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {todayKey}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Daily practice across Writing, Listening, Speaking, and Reading
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-1.5">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider">Completed</span>
          <span className="text-sm font-mono font-bold text-emerald-500">{completedCount}<span className="text-slate-400">/4</span></span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-950/70 rounded-full h-2 overflow-hidden border border-slate-800/80">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[11px] font-mono font-bold text-emerald-500 min-w-[2.6rem] text-right">
          {progressPercent}%
        </span>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {dailyTasks.map((task) => {
          let Icon = PenTool;
          let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
          if (task.skill === 'listening') {
            Icon = Headphones;
            colorClass = 'text-sky-400 bg-sky-500/10 border-sky-500/30';
          } else if (task.skill === 'speaking') {
            Icon = Mic;
            colorClass = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
          } else if (task.skill === 'reading') {
            Icon = BookOpen;
            colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
          }

          return (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                task.completed
                  ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleTask(task.id)}
                  className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-lg border text-xs ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <h4 className={`text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                      {task.chinese}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{task.desc}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateSkill(task.skill)}
                className="px-3.5 h-8 rounded-xl border border-slate-800/70 bg-slate-900/70 hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-all text-xs flex items-center gap-1 font-semibold shrink-0"
              >
                Go <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {completedCount === 4 && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center text-xs text-emerald-300 font-semibold animate-in fade-in flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Bravo! All 4 Language Pillars completed for today. Consistent daily practice builds native fluency!</span>
        </div>
      )}
    </div>
  );
};
