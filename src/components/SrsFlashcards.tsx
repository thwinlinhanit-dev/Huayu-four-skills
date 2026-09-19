import React, { useState, useEffect } from 'react';
import { Layers, Volume2, RotateCw, CheckCircle2, Trophy, Sparkles, Filter, PenTool, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CHARACTERS_DATABASE } from '../data/chineseData';
import { CharacterData } from '../types';
import { playMandarinAudio, TONE_COLORS } from '../utils/audio';
import { seedDeckFromCharacters, getReviewQueue, getSrsStats, reviewCard } from '../utils/srs';
import { addXp, recordEvent } from '../utils/progressStore';

interface SrsFlashcardsProps {
  onSelectCharacterToWrite?: (char: string) => void;
  onMasteredChange?: (char: string) => void;
}

export const SrsFlashcards: React.FC<SrsFlashcardsProps> = ({
  onSelectCharacterToWrite,
  onMasteredChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [hskFilter, setHskFilter] = useState<number | 'all'>('all');
  const [tick, setTick] = useState<number>(0);
  const refresh = () => setTick((t) => t + 1);

  // Seed the persistent deck from the character bank on first run
  useEffect(() => {
    seedDeckFromCharacters(
      CHARACTERS_DATABASE.map((c) => ({ character: c.character, pinyin: c.pinyin, meaning: c.meaning, hsk: c.hskLevel }))
    );
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live scheduler views (recomputed each render; refresh() re-renders after rating)
  const queue = getReviewQueue(150);
  const stats = getSrsStats();
  const filteredQueue = hskFilter === 'all'
    ? queue
    : queue.filter((c) => c.hsk === hskFilter);

  const currentSrs = filteredQueue.length > 0
    ? filteredQueue[Math.min(currentIndex, filteredQueue.length - 1)]
    : undefined;
  const currentCard: CharacterData | undefined = currentSrs
    ? CHARACTERS_DATABASE.find((c) => c.character === currentSrs.front)
    : undefined;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePlayAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentCard) {
      playMandarinAudio(currentCard.character, 0.85);
    }
  };

  const handleRateCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (currentSrs) {
      reviewCard(currentSrs.id, rating);
      addXp(5, 'srs_review');
      if (rating === 'good' || rating === 'easy') {
        if (onMasteredChange && currentCard) {
          onMasteredChange(currentCard.character);
        }
        recordEvent('srs_mastered', currentSrs.front);
        if (rating === 'easy') {
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        }
      }
    }
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, filteredQueue.length));
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
              记忆卡片 SRS FLASHCARDS
            </span>
            <span className="text-xs text-slate-400">Spaced Repetition System</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mt-1 font-serif">
            High-Yield HSK Vocabulary Spaced Repetition
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Optimized memory retention algorithm. Review characters right at the moment of forgetting to lock them into long-term memory.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0 flex-col sm:flex-row">
          <div className="flex items-center gap-1.5 text-xs">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Due now:</span>
            <span className="font-bold text-amber-400">{stats.due}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Reviewed today:</span>
            <span className="font-bold text-emerald-400">{stats.reviewsToday}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-mono">Filter by Level:</span>
          {(['all', 1, 2, 3, 4] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setHskFilter(lvl);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1 rounded-lg font-mono font-semibold transition-all ${
                hskFilter === lvl
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {lvl === 'all' ? 'All Cards' : `HSK ${lvl}`}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Card #{currentIndex + 1} of {filteredQueue.length}
        </span>
      </div>

      {filteredQueue.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <h4 className="text-base font-bold text-slate-100">All caught up for now!</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            New cards and due reviews will appear here. Review your trouble list, mine words from a story, or run the ear trainer to grow the deck.
          </p>
        </div>
      )}

      {/* Main Flashcard Arena */}
      {currentCard && (
        <div className="max-w-xl mx-auto flex flex-col items-center space-y-6">
          {/* Flip Card */}
          <div
            onClick={handleFlip}
            className="w-full min-h-[340px] rounded-3xl bg-slate-900 border-2 border-slate-800 hover:border-amber-500/50 cursor-pointer shadow-2xl p-8 flex flex-col items-center justify-between text-center transition-all group relative overflow-hidden"
          >
            <div className="w-full flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                HSK Level {currentCard.hskLevel}
              </span>
              <button
                onClick={handlePlayAudio}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
                title="Play Audio"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Front vs Back Display */}
            {!isFlipped ? (
              <div className="flex flex-col items-center my-auto space-y-3">
                <span className="font-serif text-7xl sm:text-8xl font-black text-amber-400 group-hover:scale-105 transition-transform">
                  {currentCard.character}
                </span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>Click anywhere to reveal pinyin, meaning & radical</span>
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center my-auto space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <span className="font-serif text-5xl font-black text-amber-400 mb-1">
                  {currentCard.character}
                </span>
                <span className="font-mono text-2xl font-bold text-slate-100">
                  {currentCard.pinyin}
                </span>
                <p className="text-sm text-slate-300 max-w-sm font-medium">
                  {currentCard.meaning}
                </p>

                <div className="pt-3 border-t border-slate-800 flex items-center gap-4 text-xs text-slate-400">
                  <span>Radical: <strong className="text-emerald-400">{currentCard.radical}</strong> ({currentCard.radicalMeaning})</span>
                  <span>Strokes: <strong className="text-sky-400 font-mono">{currentCard.strokeCount}</strong></span>
                </div>
              </div>
            )}

            {/* Action Bar at bottom */}
            <div className="w-full flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
              <span className="text-slate-500">
                {isFlipped ? 'How easily did you recall this?' : 'Tap card to check'}
              </span>

              {onSelectCharacterToWrite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCharacterToWrite(currentCard.character);
                  }}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Write stroke order</span>
                </button>
              )}
            </div>
          </div>

          {/* Anki-style Rating Buttons */}
          {isFlipped ? (
            <div className="w-full grid grid-cols-4 gap-2 sm:gap-3">
              <button
                onClick={() => handleRateCard('again')}
                className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 hover:bg-rose-500/25 text-rose-300 flex flex-col items-center transition-all"
              >
                <span className="text-xs font-bold">Again</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">&lt; 1 min</span>
              </button>

              <button
                onClick={() => handleRateCard('hard')}
                className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300 flex flex-col items-center transition-all"
              >
                <span className="text-xs font-bold">Hard</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">2 days</span>
              </button>

              <button
                onClick={() => handleRateCard('good')}
                className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/40 hover:bg-sky-500/25 text-sky-300 flex flex-col items-center transition-all"
              >
                <span className="text-xs font-bold">Good</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">4 days</span>
              </button>

              <button
                onClick={() => handleRateCard('easy')}
                className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 flex flex-col items-center transition-all"
              >
                <span className="text-xs font-bold">Easy</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">7 days</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleFlip}
              className="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <RotateCw className="w-4 h-4" />
              <span>Show Answer & Rate Retention</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
