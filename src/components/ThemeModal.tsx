import React from 'react';
import { Palette, Check, Sparkles, X, Sun, Moon, TreePine, Paintbrush, Sliders, Type } from 'lucide-react';
import { ThemePreset, FontSizeScale, THEME_PRESETS } from '../utils/themeManager';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemePreset;
  onSelectTheme: (theme: ThemePreset) => void;
  fontScale: FontSizeScale;
  onSelectFontScale: (scale: FontSizeScale) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  fontScale,
  onSelectFontScale,
}) => {
  if (!isOpen) return null;

  const themes = Object.values(THEME_PRESETS);

  const getThemeIcon = (id: ThemePreset) => {
    switch (id) {
      case 'obsidian':
        return <Moon className="w-4 h-4 text-emerald-400" />;
      case 'parchment':
        return <Sun className="w-4 h-4 text-amber-600" />;
      case 'bamboo':
        return <TreePine className="w-4 h-4 text-teal-400" />;
      case 'ink':
        return <Paintbrush className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900/95 border border-slate-800/80 rounded-2xl p-6 shadow-2xl ring-1 ring-slate-700/30 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Appearance Settings
              </h3>
              <p className="text-xs text-slate-400">Color themes and font scaling</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Cards Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aesthetic Presets (4 Schemes)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onSelectTheme(theme.id)}
                  className={`relative p-3.5 rounded-xl border text-left transition-all group cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 ring-1 ring-emerald-500/40 bg-slate-800/90 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getThemeIcon(theme.id)}
                      <span className="text-sm font-bold text-slate-100">{theme.name}</span>
                      <span className="font-serif text-xs text-slate-400">({theme.chinese})</span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
                    {theme.tagline}
                  </p>

                  {/* Palette Preview Swatch */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Palette:</span>
                    <div className="flex items-center gap-1">
                      {theme.previewPalette.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Scale Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-emerald-400" />
              <span>Typographic Scale & Character Legibility</span>
            </span>
            <span className="text-xs text-slate-400 font-mono capitalize">{fontScale}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['compact', 'standard', 'large'] as FontSizeScale[]).map((scale) => {
              const active = fontScale === scale;
              const labels: Record<FontSizeScale, { title: string; desc: string }> = {
                compact: { title: 'Compact', desc: 'Dense, more content' },
                standard: { title: 'Standard', desc: 'Default comfortable' },
                large: { title: 'Large', desc: 'Enhanced Hanzi visibility' },
              };
              return (
                <button
                  key={scale}
                  onClick={() => onSelectFontScale(scale)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{labels[scale].title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{labels[scale].desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Done */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
