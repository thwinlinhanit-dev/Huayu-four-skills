import React, { useState } from 'react';
import {
  Printer,
  Download,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Type,
  Grid,
  FileText,
} from 'lucide-react';
import { CHARACTERS_DATABASE } from '../data/chineseData';
import { CharacterData } from '../types';

interface TianZiGeWorksheetProps {
  onSelectCharacterToWrite?: (char: string) => void;
}

export const TianZiGeWorksheet: React.FC<TianZiGeWorksheetProps> = ({
  onSelectCharacterToWrite,
}) => {
  const [selectedChars, setSelectedChars] = useState<string[]>(['覆', '永', '水', '龙']);
  const [gridStyle, setGridStyle] = useState<'tianzige' | 'mizige'>('mizige');
  const [repeatCount, setRepeatCount] = useState<number>(8);
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [showRadical, setShowRadical] = useState<boolean>(true);
  const [customInput, setCustomInput] = useState<string>('');

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const chars = customInput
      .trim()
      .split('')
      .filter((c) => /[\u4e00-\u9fa5]/.test(c));
    const unique = Array.from(new Set([...selectedChars, ...chars])).slice(0, 10);
    setSelectedChars(unique);
    setCustomInput('');
  };

  const handleRemoveChar = (char: string) => {
    if (selectedChars.length <= 1) return;
    setSelectedChars(selectedChars.filter((c) => c !== char));
  };

  const handlePrint = () => {
    window.print();
  };

  const getCharInfo = (char: string): Partial<CharacterData> => {
    const found = CHARACTERS_DATABASE.find((c) => c.character === char);
    if (found) return found;
    return {
      character: char,
      pinyin: 'hànzì',
      meaning: 'Chinese character',
      strokeCount: 8,
      radical: '字',
    };
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar (hidden during print) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 font-display">
              <FileText className="w-5 h-5 text-emerald-400" />
              Tian Zi Ge Practice Sheet Generator (田字格/米字格字帖生成器)
            </h3>
            <p className="text-xs text-slate-400">
              Customize calligraphy practice sheets with trace-guides, pinyin tone marks, and stroke counts. Ready to print or export.
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>

        {/* Configurations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          {/* Grid style selector */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-emerald-400" />
              Grid Style
            </label>
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setGridStyle('mizige')}
                className={`flex-1 py-1 text-center rounded-md font-medium transition-all ${
                  gridStyle === 'mizige' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                米字格 (Mi Zi)
              </button>
              <button
                type="button"
                onClick={() => setGridStyle('tianzige')}
                className={`flex-1 py-1 text-center rounded-md font-medium transition-all ${
                  gridStyle === 'tianzige' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                田字格 (Tian Zi)
              </button>
            </div>
          </div>

          {/* Repeat boxes per row */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Practice Boxes per Row: <span className="text-emerald-400 font-bold">{repeatCount}</span>
            </label>
            <input
              type="range"
              min={4}
              max={10}
              value={repeatCount}
              onChange={(e) => setRepeatCount(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-950 rounded-lg cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Annotations</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPinyin(!showPinyin)}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-center transition-all ${
                  showPinyin ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                Pinyin
              </button>
              <button
                type="button"
                onClick={() => setShowRadical(!showRadical)}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-center transition-all ${
                  showRadical ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                Radicals
              </button>
            </div>
          </div>

          {/* Add custom character */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-emerald-400" />
              Add Characters (e.g. 爱国学)
            </label>
            <form onSubmit={handleAddCustom} className="flex gap-1.5">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="汉字..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Selected character tags */}
        <div className="flex flex-wrap gap-2 items-center pt-2">
          <span className="text-xs text-slate-400">Included:</span>
          {selectedChars.map((char) => (
            <span
              key={char}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-serif font-bold"
            >
              {char}
              <button
                type="button"
                onClick={() => handleRemoveChar(char)}
                className="text-slate-400 hover:text-rose-400 ml-1"
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Printable Sheet Canvas / Viewport */}
      <div className="printable-worksheet bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl border border-slate-200 overflow-x-auto">
        {/* Header on printed paper */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-widest text-slate-950">
              华语楷书练字帖 · CHINESE CALLIGRAPHY SHEET
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Standard Stroke Practice • Grid: {gridStyle === 'mizige' ? '米字格 (Mi Zi Ge)' : '田字格 (Tian Zi Ge)'} • Huayu Chinese Four Skills
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 hidden sm:block">
            <div>姓名 (Name): _________________</div>
            <div className="mt-1">日期 (Date): _________________</div>
          </div>
        </div>

        {/* Practice Rows */}
        <div className="space-y-6">
          {selectedChars.map((char) => {
            const info = getCharInfo(char);
            return (
              <div key={char} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-3 border-b border-slate-200">
                {/* Master Character Card */}
                <div className="w-24 shrink-0 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-300 text-center">
                  {showPinyin && (
                    <span className="text-xs font-semibold text-emerald-700 tracking-wide">
                      {info.pinyin}
                    </span>
                  )}
                  <span className="text-3xl font-serif font-black text-slate-950 my-0.5">
                    {char}
                  </span>
                  {showRadical && (
                    <span className="text-[10px] text-slate-500">
                      部首: {info.radical || '—'} · {info.strokeCount || 8}画
                    </span>
                  )}
                  {onSelectCharacterToWrite && (
                    <button
                      type="button"
                      onClick={() => onSelectCharacterToWrite(char)}
                      className="no-print mt-1 text-[10px] text-emerald-600 hover:underline"
                    >
                      Interactive Tracing →
                    </button>
                  )}
                </div>

                {/* Grids row */}
                <div className="flex-1 flex flex-wrap gap-2 items-center">
                  {Array.from({ length: repeatCount }).map((_, idx) => {
                    const isGuideTrace = idx < 2; // First 2 boxes have ghost guide
                    return (
                      <div
                        key={idx}
                        className="relative w-14 h-14 sm:w-16 sm:h-16 border-2 border-red-500/70 bg-red-50/20 flex items-center justify-center select-none"
                      >
                        {/* Tian/Mi Zi Ge Guidelines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-red-400/60" strokeDasharray="2,2">
                          <line x1="0" y1="50%" x2="100%" y2="50%" strokeWidth="1" />
                          <line x1="50%" y1="0" x2="50%" y2="100%" strokeWidth="1" />
                          {gridStyle === 'mizige' && (
                            <>
                              <line x1="0" y1="0" x2="100%" y2="100%" strokeWidth="0.8" />
                              <line x1="0" y1="100%" x2="100%" y2="0%" strokeWidth="0.8" />
                            </>
                          )}
                        </svg>

                        {/* Ghost characters for guided tracing */}
                        {isGuideTrace && (
                          <span className="relative z-10 text-3xl sm:text-4xl font-serif font-black text-slate-400/30">
                            {char}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Printable Footer */}
        <div className="mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-400">
          “字如其人，立德树人” · Practice makes perfect (熟能生巧). Keep brush upright with proper posture.
        </div>
      </div>
    </div>
  );
};
