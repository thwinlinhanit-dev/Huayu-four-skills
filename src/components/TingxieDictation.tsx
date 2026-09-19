import React, { useState, useRef, useEffect } from 'react';
import { Volume2, RotateCcw, Eye, EyeOff, CheckCircle2, XCircle, Sparkles, Trophy, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CharacterData } from '../types';
import { CHARACTERS_DATABASE } from '../data/chineseData';
import { playMandarinAudio } from '../utils/audio';
import { HanziWriterPlayer } from './HanziWriterPlayer';

interface TingxieDictationProps {
  onCharacterMastered?: (char: string) => void;
}

export const TingxieDictation: React.FC<TingxieDictationProps> = ({ onCharacterMastered }) => {
  const [charIndex, setCharIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [hidePinyinHint, setHidePinyinHint] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [brushColor, setBrushColor] = useState<string>('#34d399');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  const currentChar: CharacterData = CHARACTERS_DATABASE[charIndex % CHARACTERS_DATABASE.length];

  // Initialize canvas with Tian Zi Ge grid
  useEffect(() => {
    initCanvas();
  }, [charIndex]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    // Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, size, size);

    // Tian Zi Ge lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();

    // Diagonals (Mi Zi Ge)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    ctx.moveTo(size, 0);
    ctx.lineTo(0, size);
    ctx.stroke();
    ctx.setLineDash([]);

    // Outer border
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
  };

  const handlePlayAudio = () => {
    playMandarinAudio(currentChar.character, 0.85);
  };

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    isDrawingRef.current = true;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 9;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClear = () => {
    initCanvas();
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleSelfGrade = (isCorrect: boolean) => {
    setScore((prev) => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1,
    }));

    if (isCorrect) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      if (onCharacterMastered) {
        onCharacterMastered(currentChar.character);
      }
    }

    // Go to next
    handleNext();
  };

  const handleNext = () => {
    setIsRevealed(false);
    setCharIndex((prev) => (prev + 1) % CHARACTERS_DATABASE.length);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
              听写 TĪNGXIĚ
            </span>
            <span className="text-xs text-slate-400">Memory Dictation Mode</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 mt-1">
            Listen & Recall Character from Memory
          </h3>
          <p className="text-xs text-slate-400">
            Hear the pronunciation, recall the stroke order, draw on the grid, and reveal to self-grade.
          </p>
        </div>

        {/* Score tracker */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <Trophy className="w-4 h-4 text-amber-400" />
          <div className="text-xs">
            <span className="text-slate-400">Dictation Accuracy: </span>
            <span className="font-bold text-emerald-400">
              {score.total > 0 ? `${Math.round((score.correct / score.total) * 100)}%` : '100%'}
            </span>
            <span className="text-slate-500 text-[11px] ml-1">({score.correct}/{score.total})</span>
          </div>
        </div>
      </div>

      {/* Main Dictation Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Audio & Prompt Card */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-5">
          <span className="text-xs font-mono text-slate-500 uppercase">Word #{charIndex + 1}</span>

          {/* Big Play Audio Button */}
          <button
            onClick={handlePlayAudio}
            className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/25 flex flex-col items-center justify-center gap-1.5 transition-all group shadow-xl shadow-emerald-500/10"
          >
            <Volume2 className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Play Sound</span>
          </button>

          {/* Hints */}
          <div className="w-full space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Pinyin:</span>
              {hidePinyinHint ? (
                <span className="text-slate-600 font-mono">Hidden</span>
              ) : (
                <span className="text-emerald-400 font-mono font-bold">{currentChar.pinyin}</span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Meaning:</span>
              <span className="text-slate-300 font-medium truncate max-w-[180px]">{currentChar.meaning}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Stroke Count:</span>
              <span className="text-slate-400 font-mono">{currentChar.strokeCount} strokes</span>
            </div>
          </div>

          <button
            onClick={() => setHidePinyinHint(!hidePinyinHint)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
          >
            {hidePinyinHint ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{hidePinyinHint ? 'Show Pinyin Hint' : 'Hide Pinyin for Harder Challenge'}</span>
          </button>
        </div>

        {/* Center/Right: Drawing Canvas & Comparison */}
        <div className="lg:col-span-8 flex flex-col items-center space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* User Drawing Canvas */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs font-mono text-slate-400">Your Written Attempt (手写练习)</span>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 touch-none">
                <canvas
                  ref={canvasRef}
                  width={260}
                  height={260}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair bg-slate-950"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Canvas</span>
                </button>
              </div>
            </div>

            {/* Revealed Master Character (if revealed) */}
            {isRevealed && (
              <div className="flex flex-col items-center space-y-2 animate-in fade-in duration-300">
                <span className="text-xs font-mono text-emerald-400 font-bold">Standard Master Solution (标准字)</span>
                <div className="w-[260px] h-[260px] rounded-2xl bg-slate-950 border-2 border-emerald-500/50 flex flex-col items-center justify-center p-2">
                  <HanziWriterPlayer
                    character={currentChar.character}
                    size={220}
                    mode="guide"
                    showOutline={true}
                  />
                </div>
                <span className="text-xs font-serif font-bold text-slate-300">
                  {currentChar.character} · {currentChar.pinyin}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="w-full max-w-md pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
            {!isRevealed ? (
              <button
                onClick={handleReveal}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Reveal & Check Answer</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 w-full justify-center">
                <button
                  onClick={() => handleSelfGrade(false)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Made Mistake</span>
                </button>
                <button
                  onClick={() => handleSelfGrade(true)}
                  className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Wrote Correctly! Next →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
