import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { getCharacterStrokeData } from '../data/strokeData';
import { Play, RotateCcw, HelpCircle, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HanziWriterPlayerProps {
  character: string;
  activeStrokeIndex?: number;
  mode?: 'guide' | 'quiz';
  animationSpeed?: number;
  showOutline?: boolean;
  onStrokeComplete?: (strokeNum: number) => void;
  onQuizComplete?: () => void;
  className?: string;
  size?: number;
}

export const HanziWriterPlayer: React.FC<HanziWriterPlayerProps> = ({
  character,
  activeStrokeIndex = 0,
  mode = 'guide',
  animationSpeed = 1,
  showOutline = true,
  onStrokeComplete,
  onQuizComplete,
  className = '',
  size = 280,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizMistakes, setQuizMistakes] = useState(0);
  const [currentQuizStroke, setCurrentQuizStroke] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justCompletedStroke, setJustCompletedStroke] = useState<number | null>(null);

  // Initialize or update HanziWriter
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous writer SVG
    containerRef.current.innerHTML = '';
    setIsCompleted(false);
    setQuizMistakes(0);
    setCurrentQuizStroke(0);

    const writer = HanziWriter.create(containerRef.current, character, {
      width: size,
      height: size,
      padding: 20,
      showOutline: showOutline,
      strokeAnimationSpeed: animationSpeed,
      delayBetweenStrokes: 250,
      strokeColor: '#34d399', // emerald
      radicalColor: '#f43f5e', // coral radical
      highlightColor: '#f59e0b', // amber active highlight
      outlineColor: '#334155', // slate-700
      drawingColor: '#10b981', // stroke drawn in quiz
      drawingWidth: 16,
      charDataLoader: (char, onComplete, onErr) => {
        getCharacterStrokeData(char)
          .then((data) => {
            if (data) {
              setTotalStrokes(data.strokes.length);
              onComplete(data);
            } else {
              onErr(new Error(`Failed to load ${char}`));
            }
          })
          .catch(onErr);
      },
    });

    writerRef.current = writer;

    if (mode === 'quiz') {
      startQuiz(writer);
    } else {
      // In guide mode, highlight or animate the currently selected stroke
      writer.highlightStroke(activeStrokeIndex);
    }

    return () => {
      try {
        if (writerRef.current) {
          writerRef.current.cancelQuiz?.();
        }
      } catch {
        // ignore cleanup error
      }
    };
  }, [character, size]);

  // Update speed or outline when props change
  useEffect(() => {
    if (!writerRef.current) return;
    try {
      if (showOutline) {
        writerRef.current.showOutline();
      } else {
        writerRef.current.hideOutline();
      }
    } catch {
      // ignore
    }
  }, [showOutline]);

  // In guide mode, when activeStrokeIndex changes, highlight that stroke
  useEffect(() => {
    if (mode === 'guide' && writerRef.current && !isAnimating) {
      try {
        writerRef.current.highlightStroke(activeStrokeIndex);
      } catch {
        // ignore
      }
    }
  }, [activeStrokeIndex, mode, isAnimating]);

  const startQuiz = (writerInstance?: any) => {
    const writer = writerInstance || writerRef.current;
    if (!writer) return;

    setIsQuizActive(true);
    setIsCompleted(false);
    setQuizMistakes(0);
    setCurrentQuizStroke(0);

    writer.quiz({
      onCorrectStroke: (strokeData: any) => {
        setCurrentQuizStroke(strokeData.strokeNum + 1);
        setJustCompletedStroke(strokeData.strokeNum);
        setTimeout(() => setJustCompletedStroke(null), 800);
        onStrokeComplete?.(strokeData.strokeNum);
      },
      onMistake: (strokeData: any) => {
        setQuizMistakes((prev) => prev + 1);
      },
      onComplete: (summary: any) => {
        setIsCompleted(true);
        setIsQuizActive(false);
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
        });
        onQuizComplete?.();
      },
    });
  };

  const handlePlayFullAnimation = () => {
    if (!writerRef.current) return;
    setIsAnimating(true);
    writerRef.current.animateCharacter({
      onComplete: () => {
        setIsAnimating(false);
        writerRef.current?.highlightStroke(activeStrokeIndex);
      },
    });
  };

  const handleAnimateCurrentStroke = () => {
    if (!writerRef.current) return;
    setIsAnimating(true);
    writerRef.current.animateStroke(activeStrokeIndex, {
      onComplete: () => {
        setIsAnimating(false);
      },
    });
  };

  const handleShowHint = () => {
    if (writerRef.current && isQuizActive) {
      try {
        if (typeof writerRef.current.highlightStroke === 'function') {
          writerRef.current.highlightStroke(currentQuizStroke);
        }
      } catch (err) {
        console.warn('Could not highlight stroke hint', err);
      }
    }
  };

  const handleResetQuiz = () => {
    if (writerRef.current) {
      writerRef.current.cancelQuiz?.();
      startQuiz();
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Canvas container for HanziWriter */}
      <div className="relative flex items-center justify-center p-2 rounded-xl bg-slate-950/80 border border-slate-800">
        {/* Tian/Mi grid markings underneath */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          viewBox="0 0 100 100"
        >
          <line x1="0" y1="50" x2="100" y2="50" stroke="#10b981" strokeWidth="0.8" strokeDasharray="3,3" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#10b981" strokeWidth="0.8" strokeDasharray="3,3" />
          <line x1="0" y1="0" x2="100" y2="100" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2,2" />
        </svg>

        {/* HanziWriter mount point */}
        <div ref={containerRef} className="relative z-10 cursor-crosshair" />

        {/* Quiz Completed Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 rounded-xl backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
            <h4 className="text-base font-bold text-white">Character Mastered!</h4>
            <p className="text-xs text-slate-300 mt-1">
              You wrote <strong className="text-emerald-400 font-serif text-lg">{character}</strong> with{' '}
              {quizMistakes === 0 ? 'perfect accuracy (0 mistakes)!' : `${quizMistakes} mistakes.`}
            </p>
            <button
              onClick={handleResetQuiz}
              className="mt-4 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Practice Again
            </button>
          </div>
        )}
      </div>

      {/* Control Bar based on Mode */}
      {mode === 'guide' ? (
        <div className="mt-3 w-full flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayFullAnimation}
              disabled={isAnimating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold shadow-md shadow-emerald-500/20 transition-all"
              title="Animate entire character"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>{isAnimating ? 'Playing...' : 'Animate Character'}</span>
            </button>
            <button
              onClick={handleAnimateCurrentStroke}
              disabled={isAnimating}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
              title="Animate active stroke"
            >
              <span>Play Stroke {activeStrokeIndex + 1}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-mono text-[11px]">
              Stroke <strong className="text-emerald-400">{activeStrokeIndex + 1}</strong>
              {totalStrokes > 0 ? ` / ${totalStrokes}` : ''}
            </span>
          </div>
        </div>
      ) : (
        /* Quiz Mode Controls */
        <div className="mt-3 w-full flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 font-mono font-medium">
              Stroke {currentQuizStroke + 1} / {totalStrokes || '?'}
            </span>
            {quizMistakes > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/20 text-rose-300 font-mono text-[11px]">
                <AlertTriangle className="w-3 h-3" />
                {quizMistakes} {quizMistakes === 1 ? 'mistake' : 'mistakes'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShowHint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-all"
              title="Flash stroke hint"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hint</span>
            </button>
            <button
              onClick={handleResetQuiz}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
              title="Restart Quiz"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
