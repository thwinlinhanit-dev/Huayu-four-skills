import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { SkillTab } from './types';
import { Header } from './components/Header';
import { DailyFourSkillsRoutine } from './components/DailyFourSkillsRoutine';
import { PenTool, Headphones, Mic, BookOpen, Sparkles, Palette } from 'lucide-react';
import { ScriptMode } from './utils/scriptConverter';
import { ThemePreset, FontSizeScale, THEME_PRESETS } from './utils/themeManager';
import { ThemeModal } from './components/ThemeModal';
import {
  getStreak,
  onProgressChange,
  registerPractice,
  addMasteredCharacter,
  recordListening,
  loadProgress,
} from './utils/progressStore';
import { getDueCount } from './utils/srs';
const ProgressDashboard = React.lazy(() =>
  import('./components/ProgressDashboard').then((m) => ({ default: m.ProgressDashboard }))
);

// Lazy-loaded skill modules → splits the giant single JS chunk at build time
const WritingSkill = lazy(() => import('./components/WritingSkill').then((m) => ({ default: m.WritingSkill })));
const ListeningSkill = lazy(() => import('./components/ListeningSkill').then((m) => ({ default: m.ListeningSkill })));
const SpeakingSkill = lazy(() => import('./components/SpeakingSkill').then((m) => ({ default: m.SpeakingSkill })));
const ReadingSkill = lazy(() => import('./components/ReadingSkill').then((m) => ({ default: m.ReadingSkill })));

export default function App() {
  const [activeTab, setActiveTab] = useState<SkillTab>('writing');
  const [characterToWrite, setCharacterToWrite] = useState<string>('覆');
  const [streakDays, setStreakDays] = useState<number>(() => getStreak().current);
  const [dueCount, setDueCount] = useState<number>(() => getDueCount());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  // Theme Preset
  const [theme, setTheme] = useState<ThemePreset>(() => {
    try {
      const saved = localStorage.getItem('huayu_theme_preset');
      return (saved as ThemePreset) || 'parchment';
    } catch {
      return 'parchment';
    }
  });

  // Font Size Scale
  const [fontScale, setFontScale] = useState<FontSizeScale>(() => {
    try {
      const saved = localStorage.getItem('huayu_font_scale');
      return (saved as FontSizeScale) || 'standard';
    } catch {
      return 'standard';
    }
  });

  const handleThemeChange = (newTheme: ThemePreset) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('huayu_theme_preset', newTheme);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFontScaleChange = (newScale: FontSizeScale) => {
    setFontScale(newScale);
    try {
      localStorage.setItem('huayu_font_scale', newScale);
    } catch (e) {
      console.error(e);
    }
  };

  const [scriptMode, setScriptMode] = useState<ScriptMode>(() => {
    try {
      const saved = localStorage.getItem('huayu_script_mode');
      return (saved as ScriptMode) || 'simplified';
    } catch {
      return 'simplified';
    }
  });

  const handleScriptModeChange = (mode: ScriptMode) => {
    setScriptMode(mode);
    try {
      localStorage.setItem('huayu_script_mode', mode);
    } catch (e) {
      console.error(e);
    }
  };

  const [masteredCharacters, setMasteredCharacters] = useState<string[]>(() => loadProgress().masteredCharacters);

  // Migrate legacy `huayu_mastered` / demo characters into the unified store on
  // first run, then subscribe so Header stats refresh whenever progress changes.
  useEffect(() => {
    const p = loadProgress();
    if (p.masteredCharacters.length === 0) {
      let seed: string[] = [];
      try {
        const legacy = localStorage.getItem('huayu_mastered');
        seed = legacy ? (JSON.parse(legacy) as string[]) : [];
      } catch {
        /* ignore malformed legacy data */
      }
      if (seed.length === 0) seed = ['覆', '好', '中'];
      for (const c of seed) addMasteredCharacter(c);
    }
    setMasteredCharacters(loadProgress().masteredCharacters);
    setDueCount(getDueCount());

    const unsub = onProgressChange(() => {
      setStreakDays(getStreak().current);
      setMasteredCharacters(loadProgress().masteredCharacters);
      setDueCount(getDueCount());
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save mastered characters to the unified store (deduped + XP)
  const handleCharacterMastered = (char: string) => {
    if (addMasteredCharacter(char)) {
      setMasteredCharacters(loadProgress().masteredCharacters);
      registerPractice();
    }
  };

  // Tracks cumulative listening totals so deltas can be persisted without double counting
  const listenRef = useRef<{ correct: number; total: number }>({ correct: 0, total: 0 });

  const handleSelectCharacterToWrite = (char: string) => {
    setCharacterToWrite(char);
    setActiveTab('writing');
  };

  const themeConfig = THEME_PRESETS[theme] || THEME_PRESETS.obsidian;

  return (
    <div
      className={`min-h-screen ${themeConfig.rootClass} scale-${fontScale} flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300 transition-colors duration-300`}
    >
      {/* Sticky Header with 4 Skills Switcher */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        streakDays={streakDays}
        dueCount={dueCount}
        masteredCount={masteredCharacters.length}
        scriptMode={scriptMode}
        onScriptModeChange={handleScriptModeChange}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
      />

      {/* Theme Studio Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={theme}
        onSelectTheme={handleThemeChange}
        fontScale={fontScale}
        onSelectFontScale={handleFontScaleChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Dynamic Skill View */}
        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-xs text-slate-400">
              Loading skill…
            </div>
          }
        >
        {activeTab === 'writing' && (
          <WritingSkill
            initialCharacter={characterToWrite}
            onCharacterMastered={handleCharacterMastered}
            isMastered={masteredCharacters.includes(characterToWrite)}
          />
        )}

        {activeTab === 'listening' && (
          <ListeningSkill
            onScoreUpdate={(correct, total) => {
              const prev = listenRef.current;
              const dc = correct - prev.correct;
              const dt = total - prev.total;
              listenRef.current = { correct, total };
              if (dt > 0) {
                recordListening(dc, dt);
                registerPractice();
              }
            }}
          />
        )}

        {activeTab === 'speaking' && <SpeakingSkill />}

        {activeTab === 'reading' && (
          <ReadingSkill
            onSelectCharacterToWrite={handleSelectCharacterToWrite}
            onCharacterMastered={handleCharacterMastered}
          />
        )}

        </Suspense>

        {/* Daily 4-Skills Balanced Practice Card */}
        {activeTab === 'dashboard' && (
          <Suspense
            fallback={
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-xs text-slate-400">
                Loading dashboard…
              </div>
            }
          >
            <ProgressDashboard onNavigateSkill={setActiveTab} />
          </Suspense>
        )}

        {activeTab !== 'dashboard' && (
        <React.Fragment>
        <div className="mt-8">
          <DailyFourSkillsRoutine
            onNavigateSkill={setActiveTab}
            onSelectCharacterToWrite={handleSelectCharacterToWrite}
            onPractice={registerPractice}
          />
        </div>

        {/* 4 Skills Footer Navigation */}
        <footer className="mt-12 pt-8 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-[11px] bg-gradient-to-br from-[#d94a1e] to-[#a32d0a] flex items-center justify-center text-[#fffdf8] font-serif font-black text-sm">
                华
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-200 tracking-tight">华語 Huayu</div>
                <div className="text-[11px] truncate">Integrated Four Skills Mandarin System · 听说读写</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {([
                ['writing', 'Writing 写'],
                ['listening', 'Listening 听'],
                ['speaking', 'Speaking 说'],
                ['reading', 'Reading 读'],
              ] as [SkillTab, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`hover:text-slate-200 transition-colors font-medium ${
                    activeTab === id
                      ? id === 'writing' ? 'text-emerald-500'
                        : id === 'listening' ? 'text-sky-500'
                        : id === 'speaking' ? 'text-purple-500'
                        : 'text-amber-500'
                      : 'text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-5 text-[11px] text-slate-500">
            每天进步一点点 — Built for consistent daily practice · © 2026 Huayu
          </p>
        </footer>
        </React.Fragment>
        )}
      </main>
    </div>
  );
}
