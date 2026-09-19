import React, { useState } from 'react';
import { Volume2, BookOpen, PenTool, Sparkles, ChevronRight, Award } from 'lucide-react';
import { CHENGYU_DATABASE } from '../data/chineseData';
import { ChengyuItem } from '../types';
import { playMandarinAudio } from '../utils/audio';

interface ChengyuMasterclassProps {
  onSelectCharacterToWrite: (char: string) => void;
}

export const ChengyuMasterclass: React.FC<ChengyuMasterclassProps> = ({ onSelectCharacterToWrite }) => {
  const [selectedChengyu, setSelectedChengyu] = useState<ChengyuItem>(CHENGYU_DATABASE[0]);

  const handlePlayIdiom = () => {
    playMandarinAudio(selectedChengyu.idiom, 0.8);
  };

  const handlePlaySingleChar = (char: string) => {
    playMandarinAudio(char, 0.85);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
              成语 CHÉNGYǓ
            </span>
            <span className="text-xs text-slate-400">Classical Four-Character Idiom Masterclass</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mt-1 font-serif">
            Master the Stories & Strokes of China's Greatest Proverbs
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Chengyu distill centuries of philosophical, military, and historical wisdom into four concise characters.
            Click any character to practice its stroke order.
          </p>
        </div>

        <button
          onClick={handlePlayIdiom}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all shrink-0"
        >
          <Volume2 className="w-4 h-4" />
          <span>Listen to Idiom</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Idiom Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider block mb-1">
            Select Idiom ({CHENGYU_DATABASE.length})
          </span>
          {CHENGYU_DATABASE.map((item) => {
            const isSelected = selectedChengyu.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedChengyu(item)}
                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                      {item.idiom}
                    </span>
                    <span className="text-xs font-mono text-amber-400">{item.pinyin}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-1">{item.literal}</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    item.difficulty === 'Beginner'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : item.difficulty === 'Intermediate'
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'bg-purple-500/20 text-purple-300'
                  }`}
                >
                  {item.difficulty}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Active Idiom Deep Dive */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          {/* 4 Interactive Character Tiles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Click Any Character to Practice Writing
              </span>
              <span className="text-xs text-amber-400 font-mono">{selectedChengyu.pinyin}</span>
            </div>

            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {selectedChengyu.characters.map((char, idx) => (
                <div
                  key={idx}
                  className="p-3 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col items-center justify-between text-center group relative overflow-hidden"
                >
                  <div className="absolute top-1.5 left-2 text-[10px] font-mono text-slate-600">
                    #{idx + 1}
                  </div>

                  {/* Character in Tian Zi Ge Style */}
                  <span className="font-serif text-4xl sm:text-5xl font-black text-amber-400 my-2 group-hover:scale-110 transition-transform">
                    {char}
                  </span>

                  {/* Actions */}
                  <div className="w-full flex items-center justify-center gap-1.5 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handlePlaySingleChar(char)}
                      className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300"
                      title="Pronounce Character"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectCharacterToWrite(char)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium"
                      title="Write this character stroke-by-stroke"
                    >
                      <PenTool className="w-3 h-3" />
                      <span>Write</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meaning Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase">Literal Translation (字面意义)</span>
              <p className="text-sm font-semibold text-slate-200">{selectedChengyu.literal}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">Figurative Meaning (引申寓意)</span>
              <p className="text-sm font-semibold text-slate-200">{selectedChengyu.figurative}</p>
            </div>
          </div>

          {/* Origin Story */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <BookOpen className="w-4 h-4" />
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider">Historical Origin & Legend (成语故事)</h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {selectedChengyu.story}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
