import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  PenTool,
  Volume2,
} from 'lucide-react';
import { RADICAL_DECOMPOSITION_DATABASE, RadicalDecomposition } from '../data/radicalDecompositionData';
import { playMandarinAudio } from '../utils/audio';

interface RadicalDecompositionExplorerProps {
  onSelectCharacterToWrite?: (char: string) => void;
}

export const RadicalDecompositionExplorer: React.FC<RadicalDecompositionExplorerProps> = ({
  onSelectCharacterToWrite,
}) => {
  const [selectedItem, setSelectedItem] = useState<RadicalDecomposition>(
    RADICAL_DECOMPOSITION_DATABASE[0]
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = RADICAL_DECOMPOSITION_DATABASE.filter(
    (item) =>
      item.character.includes(searchQuery) ||
      item.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 font-display">
            <Layers className="w-5 h-5 text-emerald-400" />
            Radical Decomposition & Character Anatomy (汉字拆解与形声解构)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Understand how 80%+ of Chinese characters are built from Semantic Roots (形旁 meaning) + Phonetic Clues (声旁 sound).
          </p>
        </div>

        {/* Quick Filter */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search character or pinyin..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main Grid: Selection Bar + Anatomy Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Character Selector */}
        <div className="lg:col-span-4 space-y-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 max-h-[580px] overflow-y-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
            Deconstructed Hanzi ({filtered.length})
          </span>
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((item) => {
              const isSelected = selectedItem.character === item.character;
              return (
                <button
                  key={item.character}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-serif font-black">{item.character}</span>
                    <span className="text-[11px] font-semibold text-emerald-400">{item.pinyin}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-1">{item.meaning}</p>
                  <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.formation}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Anatomy Matrix */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Top Character Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950">
                  <span className="text-5xl font-serif font-black text-emerald-300">
                    {selectedItem.character}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white font-serif">{selectedItem.character}</h2>
                    <span className="text-base font-semibold text-emerald-400">{selectedItem.pinyin}</span>
                    <button
                      onClick={() => playMandarinAudio(selectedItem.character, 0.85)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Play Pronunciation"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{selectedItem.meaning}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      {selectedItem.formation}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      Structure: {selectedItem.structure}
                    </span>
                  </div>
                </div>
              </div>

              {onSelectCharacterToWrite && (
                <button
                  onClick={() => onSelectCharacterToWrite(selectedItem.character)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <PenTool className="w-4 h-4" />
                  Write & Trace Character
                </button>
              )}
            </div>

            {/* Visual Decomposition Equation */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Decomposition Formula (拆解公式)
              </span>

              <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-center gap-3 text-center">
                {selectedItem.components.map((comp, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-xl font-bold text-emerald-400">+</span>}
                    <div className="p-3 sm:p-4 rounded-xl bg-slate-900 border border-slate-800 min-w-[110px] text-center space-y-1">
                      <span className="text-3xl font-serif font-black text-white block">
                        {comp.part}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400 block">
                        {comp.pinyin}
                      </span>
                      <span className="text-[11px] text-slate-300 block">{comp.meaning}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${
                        comp.role === 'semantic'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : comp.role === 'phonetic'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {comp.role === 'semantic'
                          ? '形旁 (Meaning)'
                          : comp.role === 'phonetic'
                          ? '声旁 (Sound)'
                          : '部首 (Root)'}
                      </span>
                    </div>
                  </React.Fragment>
                ))}

                <span className="text-xl font-bold text-slate-400">=</span>

                <div className="p-3 sm:p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 min-w-[110px] text-center space-y-1">
                  <span className="text-3xl font-serif font-black text-emerald-300 block">
                    {selectedItem.character}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 block">
                    {selectedItem.pinyin}
                  </span>
                  <span className="text-[11px] text-slate-300 block">{selectedItem.meaning}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Target
                  </span>
                </div>
              </div>
            </div>

            {/* Mnemonic / Etymological Explanation */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Mnemonic Memory Anchor (记忆口诀与演变)
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                {selectedItem.mnemonic}
              </p>
            </div>

            {/* Phonetic Family (Same Sound Radical Sharing) */}
            {selectedItem.cognates && selectedItem.cognates.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  Phonetic Family / Cognates (形声字同声族)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedItem.cognates.map((cog, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl font-serif font-bold text-white">{cog.char}</span>
                        <div>
                          <div className="text-xs font-semibold text-sky-400">{cog.pinyin}</div>
                          <div className="text-[11px] text-slate-400">{cog.meaning}</div>
                        </div>
                      </div>
                      {onSelectCharacterToWrite && (
                        <button
                          type="button"
                          onClick={() => onSelectCharacterToWrite(cog.char)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300"
                        >
                          Write →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
