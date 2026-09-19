import React, { useState } from 'react';
import { Volume2, CheckCircle2, XCircle, Trophy, Sparkles, HelpCircle, Shuffle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MINIMAL_PAIRS } from '../data/chineseData';
import { MinimalPair } from '../types';
import { playMandarinAudio } from '../utils/audio';

export const MinimalPairsTrainer: React.FC = () => {
  const [pairIndex, setPairIndex] = useState<number>(0);
  const [targetItemKey, setTargetItemKey] = useState<'itemA' | 'itemB'>('itemA');
  const [selectedAnswer, setSelectedAnswer] = useState<'itemA' | 'itemB' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });

  const currentPair: MinimalPair = MINIMAL_PAIRS[pairIndex % MINIMAL_PAIRS.length];

  const handlePlayPrompt = () => {
    const targetObj = currentPair[targetItemKey];
    playMandarinAudio(targetObj.char, 0.85);
  };

  const handleSelectChoice = (choice: 'itemA' | 'itemB') => {
    if (isSubmitted) return;
    setSelectedAnswer(choice);
    setIsSubmitted(true);

    const isCorrect = choice === targetItemKey;
    setScore((prev) => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1,
    }));

    if (isCorrect) {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
    // Randomize target between A and B
    setTargetItemKey(Math.random() > 0.5 ? 'itemA' : 'itemB');
    setPairIndex((prev) => (prev + 1) % MINIMAL_PAIRS.length);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold font-mono">
              极小对音 MINIMAL PAIRS
            </span>
            <span className="text-xs text-slate-400">Ear Acuity Drill</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 mt-1">
            Differentiate Tricky Chinese Phoneme Contrasts
          </h3>
          <p className="text-xs text-slate-400">
            Train your ear to detect subtle differences between retroflex consonants, dental sibilants, and nasal endings.
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2.5 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 shrink-0">
          <Trophy className="w-4 h-4 text-amber-400" />
          <div className="text-xs">
            <span className="text-slate-400">Ear Accuracy: </span>
            <span className="font-bold text-sky-400">
              {score.total > 0 ? `${Math.round((score.correct / score.total) * 100)}%` : '100%'}
            </span>
            <span className="text-slate-500 text-[11px] ml-1">({score.correct}/{score.total})</span>
          </div>
        </div>
      </div>

      {/* Main Pair Test Arena */}
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-mono text-sky-400 uppercase tracking-wider font-semibold">
            {currentPair.category}
          </span>
          <p className="text-xs text-slate-400 max-w-md">{currentPair.description}</p>
        </div>

        {/* Play Audio Prompt Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={handlePlayPrompt}
            className="w-24 h-24 rounded-full bg-sky-500/15 border-2 border-sky-500/40 hover:border-sky-400 hover:bg-sky-500/25 flex flex-col items-center justify-center gap-1.5 transition-all group shadow-xl shadow-sky-500/10"
          >
            <Volume2 className="w-8 h-8 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Play Sound</span>
          </button>
          <span className="text-xs text-slate-400 mt-2">Listen closely: Which sound did you hear?</span>
        </div>

        {/* The Two Choice Cards: A vs B */}
        <div className="w-full grid grid-cols-2 gap-4">
          {(['itemA', 'itemB'] as const).map((key) => {
            const item = currentPair[key];
            const isSelected = selectedAnswer === key;
            const isCorrect = key === targetItemKey;

            return (
              <div
                key={key}
                onClick={() => !isSubmitted && handleSelectChoice(key)}
                className={`p-5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all group ${
                  isSubmitted
                    ? isCorrect
                      ? 'bg-emerald-500/20 border-emerald-500/70 ring-2 ring-emerald-500/30'
                      : isSelected
                      ? 'bg-rose-500/20 border-rose-500/70'
                      : 'bg-slate-950 border-slate-800 opacity-60'
                    : 'bg-slate-950 border-slate-800 hover:border-sky-500/50 hover:bg-slate-900/80 cursor-pointer shadow-lg'
                }`}
                role="button"
                tabIndex={isSubmitted ? -1 : 0}
                onKeyDown={(e) => {
                  if (!isSubmitted && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleSelectChoice(key);
                  }
                }}
              >
                <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>{item.ipa}</span>
                  {isSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {isSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                </div>

                <span className="font-serif text-4xl sm:text-5xl font-black text-slate-100 my-2 group-hover:text-sky-300 transition-colors">
                  {item.char}
                </span>

                <div className="space-y-0.5">
                  <span className="font-mono text-base font-bold text-sky-400">{item.pinyin}</span>
                  <p className="text-xs text-slate-400">{item.meaning}</p>
                </div>

                {isSubmitted && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playMandarinAudio(item.char, 0.85);
                    }}
                    className="mt-3 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Volume2 className="w-3 h-3 text-sky-400" />
                    <span>Hear this</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Feedback & Next Button */}
        {isSubmitted && (
          <div className="w-full pt-4 border-t border-slate-800 flex items-center justify-between animate-in fade-in">
            <div className="text-left text-xs">
              {selectedAnswer === targetItemKey ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Perfect Ear! You correctly identified {currentPair[targetItemKey].pinyin}.
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> That was {currentPair[targetItemKey].pinyin} ({currentPair[targetItemKey].char}).
                </span>
              )}
            </div>

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all"
            >
              Next Pair →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
