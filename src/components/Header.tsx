import React from 'react';
import { PenTool, Headphones, Mic, BookOpen, Flame, Star, Palette, Sparkles } from 'lucide-react';
import { SkillTab } from '../types';
import { ScriptSwitcher } from './ScriptSwitcher';
import { ScriptMode } from '../utils/scriptConverter';

interface HeaderProps {
  activeTab: SkillTab;
  onSelectTab: (tab: SkillTab) => void;
  streakDays: number;
  dueCount?: number;
  masteredCount: number;
  scriptMode: ScriptMode;
  onScriptModeChange: (mode: ScriptMode) => void;
  onOpenThemeModal?: () => void;
  onOpenSearch?: () => void;
}

const DISPLAY_CHARS: Partial<Record<SkillTab, { simplified: string; traditional: string }>> = {
  writing: { simplified: '写', traditional: '寫' },
  listening: { simplified: '听', traditional: '聽' },
  speaking: { simplified: '说', traditional: '說' },
  reading: { simplified: '读', traditional: '讀' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  streakDays,
  dueCount = 0,
  masteredCount,
  scriptMode,
  onScriptModeChange,
  onOpenThemeModal,
  onOpenSearch,
}) => {
  const tabs: {
    id: SkillTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    activePill: string;
    idleIcon: string;
  }[] = [
    { id: 'writing', label: 'Writing', icon: PenTool, activePill: 'bg-emerald-500', idleIcon: 'text-emerald-500' },
    { id: 'listening', label: 'Listening', icon: Headphones, activePill: 'bg-sky-500', idleIcon: 'text-sky-500' },
    { id: 'speaking', label: 'Speaking', icon: Mic, activePill: 'bg-purple-500', idleIcon: 'text-purple-500' },
    { id: 'reading', label: 'Reading', icon: BookOpen, activePill: 'bg-amber-500', idleIcon: 'text-amber-500' },
  ];
  const isDashboard = activeTab === 'dashboard';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-5">
          {/* Brand — clicking the logo opens the progress dashboard */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-3 shrink-0 min-w-0 rounded-xl px-1 -mx-1 py-0.5 transition-colors ${
              isDashboard ? 'bg-slate-800/60' : 'hover:bg-slate-800/40'
            }`}
            title="Progress dashboard"
          >
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#d94a1e] to-[#a32d0a] shadow-md shadow-rose-500/20 flex items-center justify-center">
              <span className="text-[#fffdf8] font-serif font-black text-lg leading-none select-none">华</span>
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5 text-sm font-bold tracking-tight text-slate-100 leading-none">
                华語 <span className="text-slate-300">Huayu</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Four Skills · 听说读写</p>
            </div>
          </button>

          {/* Core 4 skill tabs */}
          <nav className="flex items-center gap-0.5 p-1 rounded-2xl border border-slate-800/80 bg-slate-900/40" aria-label="Core skills">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const char = scriptMode === 'traditional' ? DISPLAY_CHARS[tab.id].traditional : DISPLAY_CHARS[tab.id].simplified;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 h-8 px-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? `${tab.activePill} text-slate-950 shadow-md shadow-slate-700/30`
                      : 'text-slate-500 hover:bg-slate-700/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : tab.idleIcon}`} />
                  <span className="font-serif font-black text-xs">{char}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Stats, script switch & theme */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <ScriptSwitcher mode={scriptMode} onChange={onScriptModeChange} />

            {onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                className="h-8 px-2.5 rounded-xl border border-slate-800/80 bg-slate-900/70 hover:bg-slate-700/60 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                title="Theme & font settings"
              >
                <Palette className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-slate-800/80 bg-slate-900/70 text-xs text-amber-500" title="Day practice streak">
              <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="font-bold text-sm">{streakDays}</span>
              <span className="hidden sm:inline text-slate-500 text-[10px]">days</span>
            </div>
            {/* Due reviews → jump into the memory hub */}
            {dueCount > 0 && (
              <button
                onClick={() => onSelectTab('reading')}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-slate-800/80 bg-slate-900/70 hover:bg-slate-700/60 text-xs text-amber-500 transition-colors cursor-pointer"
                title="SRS reviews due now — jump to the memory hub"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold text-sm">{dueCount}</span>
                <span className="hidden sm:inline text-slate-500 text-[10px]">due</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-slate-800/80 bg-slate-900/70 text-xs text-emerald-500" title="Characters mastered">
              <Star className="w-3.5 h-3.5 text-emerald-500 fill-slate-700" />
              <span className="font-bold text-sm">{masteredCount}</span>
              <span className="hidden sm:inline text-slate-500 text-[10px]">learned</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
