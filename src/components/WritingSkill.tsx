import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Star,
  Share2,
  BookOpen,
  PenTool,
  Search,
  CheckCircle2,
  Trash2,
  Undo2,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Compass,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CharacterData } from '../types';
import { playMandarinAudio, TONE_COLORS } from '../utils/audio';
import { CHARACTERS_DATABASE, RADICALS_LIST, YONG_PRINCIPLES } from '../data/chineseData';
import { getCharacterStrokeData, PRECACHED_STROKES, HanziCharData } from '../data/strokeData';
import { StrokeStepSvg } from './StrokeStepSvg';
import { HanziWriterPlayer } from './HanziWriterPlayer';
import { ChengyuMasterclass } from './ChengyuMasterclass';
import { TingxieDictation } from './TingxieDictation';
import { TianZiGeWorksheet } from './TianZiGeWorksheet';
import { RadicalDecompositionExplorer } from './RadicalDecompositionExplorer';
import { ModernDropdown, DropdownOption } from './ModernDropdown';

interface WritingSkillProps {
  initialCharacter?: string;
  onCharacterMastered?: (char: string) => void;
  isMastered?: boolean;
}

export type WritingViewMode =
  | 'strokeGuide'
  | 'tracingQuiz'
  | 'tingxie'
  | 'chengyu'
  | 'practiceCanvas'
  | 'worksheet'
  | 'decomposition'
  | 'yongPrinciples'
  | 'radicals';

export const WritingSkill: React.FC<WritingSkillProps> = ({
  initialCharacter = '覆',
  onCharacterMastered,
  isMastered = false,
}) => {
  const [selectedChar, setSelectedChar] = useState<CharacterData>(() => {
    return (
      CHARACTERS_DATABASE.find((c) => c.character === initialCharacter) ||
      CHARACTERS_DATABASE[0]
    );
  });

  const [viewMode, setViewMode] = useState<WritingViewMode>('strokeGuide');
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState<number>(0);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<number>(800); // ms per stroke
  const [isFavorited, setIsFavorited] = useState<boolean>(isMastered);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState<boolean>(false);
  const [showGhostGuide, setShowGhostGuide] = useState<boolean>(true);
  const [gridType, setGridType] = useState<'mizige' | 'tianzige' | 'jiugongge'>('mizige');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [brushColor, setBrushColor] = useState<string>('#34d399');
  const [canvasStrokesCount, setCanvasStrokesCount] = useState<number>(0);
  const [isCurrentlyDrawing, setIsCurrentlyDrawing] = useState<boolean>(false);
  const [recentCompletedStroke, setRecentCompletedStroke] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Stroke vector data from CDN / precache
  const [charStrokeData, setCharStrokeData] = useState<HanziCharData | null>(() => {
    return PRECACHED_STROKES[selectedChar.character] || null;
  });

  // Selected principle in Yong workshop
  const [selectedPrincipleId, setSelectedPrincipleId] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const strokesHistoryRef = useRef<ImageData[]>([]);
  const animationTimerRef = useRef<any>(null);

  // Load stroke data for the selected character
  useEffect(() => {
    let isCurrent = true;
    getCharacterStrokeData(selectedChar.character).then((data) => {
      if (isCurrent) {
        setCharStrokeData(data);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [selectedChar.character]);

  // Sync with initialCharacter prop changes
  useEffect(() => {
    if (initialCharacter) {
      const found = CHARACTERS_DATABASE.find((c) => c.character === initialCharacter);
      if (found) {
        setSelectedChar(found);
        setCurrentStrokeIndex(0);
        setIsPlayingAnimation(false);
      }
    }
  }, [initialCharacter]);

  // Handle stroke animation loop
  useEffect(() => {
    if (isPlayingAnimation) {
      const totalStrokes = selectedChar.strokeSequence.length;
      animationTimerRef.current = setInterval(() => {
        setCurrentStrokeIndex((prev) => {
          if (prev >= totalStrokes - 1) {
            setIsPlayingAnimation(false);
            return prev;
          }
          return prev + 1;
        });
      }, animationSpeed);
    } else {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    }

    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, [isPlayingAnimation, animationSpeed, selectedChar]);

  // Redraw canvas background & grid when switched to practiceCanvas
  useEffect(() => {
    if (viewMode === 'practiceCanvas') {
      initCanvas();
    }
  }, [viewMode, gridType, showGhostGuide, selectedChar]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handlePlayAudio = () => {
    playMandarinAudio(selectedChar.character, 0.85);
  };

  const handlePlayStrokeAudio = (strokeName: string) => {
    playMandarinAudio(strokeName, 0.9);
  };

  const toggleAnimation = () => {
    if (isPlayingAnimation) {
      setIsPlayingAnimation(false);
    } else {
      if (currentStrokeIndex >= selectedChar.strokeSequence.length - 1) {
        setCurrentStrokeIndex(0);
      }
      setIsPlayingAnimation(true);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    if (!isFavorited && onCharacterMastered) {
      onCharacterMastered(selectedChar.character);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      showToast(`Marked "${selectedChar.character}" as Mastered!`);
    } else {
      showToast(`Removed from favorites`);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Learning Chinese character ${selectedChar.character} (${selectedChar.pinyin} - ${selectedChar.meaning}) with ${selectedChar.strokeCount} strokes!`
      );
      showToast('Character details copied to clipboard!');
    }
  };

  const loadCharacter = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Check if in existing database
    const localMatch = CHARACTERS_DATABASE.find(
      (c) =>
        c.character === trimmed ||
        c.pinyin.toLowerCase().replace(/[^a-z]/g, '') === trimmed.toLowerCase() ||
        c.meaning.toLowerCase().includes(trimmed.toLowerCase())
    );

    if (localMatch) {
      setSelectedChar(localMatch);
      setCurrentStrokeIndex(0);
      setIsPlayingAnimation(false);
      setSearchQuery('');
      return;
    }

    // Single Chinese character query to AI analyzer & CDN stroke vector data
    const char = trimmed[0];
    setIsAnalyzingCustom(true);
    showToast(`Loading stroke breakdown for "${char}"...`);

    try {
      // First attempt to load vector strokes
      const strokeVector = await getCharacterStrokeData(char);

      // Attempt AI metadata fetch
      let metaData: any = {};
      try {
        const res = await fetch('/api/character/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character: char }),
        });
        if (res.ok) {
          metaData = await res.json();
        }
      } catch {
        // Fallback metadata if API is unavailable
      }

      const strokeCount = strokeVector?.strokes.length || metaData.strokeCount || 6;
      const strokeSeq =
        metaData.strokeSequence && metaData.strokeSequence.length === strokeCount
          ? metaData.strokeSequence
          : Array.from({ length: strokeCount }).map((_, i) => ({
              step: i + 1,
              type: `第${i + 1}笔`,
              name: `Stroke ${i + 1}`,
            }));

      const customChar: CharacterData = {
        id: `custom-${char}`,
        character: char,
        pinyin: metaData.pinyin || 'zì',
        tone: (metaData.tone as any) || 1,
        meaning: metaData.meaning || 'Chinese character',
        radical: metaData.radical || '部首',
        radicalMeaning: metaData.radicalMeaning || 'radical component',
        strokeCount: strokeCount,
        hskLevel: metaData.hskLevel || 1,
        etymology: metaData.etymology || `Standard stroke-by-stroke decomposed character for ${char}.`,
        examples: metaData.examples || [],
        strokeSequence: strokeSeq,
      };

      setSelectedChar(customChar);
      setCharStrokeData(strokeVector);
      setCurrentStrokeIndex(0);
      setIsPlayingAnimation(false);
      showToast(`Loaded "${char}" (${strokeCount} strokes)`);
    } catch (err) {
      console.error(err);
      showToast('Error loading character.');
    } finally {
      setIsAnalyzingCustom(false);
      setSearchQuery('');
    }
  };

  // Custom character lookup (loads stroke data dynamically for any character)
  const handleSearchCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadCharacter(searchQuery);
  };

  // Canvas drawing operations
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    // Background (dark slate matching Pleco/Hanzi app)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);

    // Center vertical and horizontal lines
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Diagonals for Mi Zi Ge
    if (gridType === 'mizige') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size, size);
      ctx.moveTo(size, 0);
      ctx.lineTo(0, size);
      ctx.stroke();
    }

    // Outer border
    ctx.setLineDash([]);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, size, size);

    // Ghost character guide (faint watermark for tracing)
    if (showGhostGuide) {
      ctx.font = 'bold 220px "Noto Serif SC", "Songti SC", serif';
      ctx.fillStyle = 'rgba(52, 211, 153, 0.09)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedChar.character, size / 2, size / 2 + 10);
    }

    setCanvasStrokesCount(0);
    strokesHistoryRef.current = [];
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

    // Save history snapshot before new stroke
    strokesHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

    const { x, y } = getCanvasCoordinates(e);
    isDrawingRef.current = true;
    setIsCurrentlyDrawing(true);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
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
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      setIsCurrentlyDrawing(false);
      setCanvasStrokesCount((prev) => {
        const next = prev + 1;
        setRecentCompletedStroke(next);
        setTimeout(() => setRecentCompletedStroke(null), 900);
        return next;
      });
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (strokesHistoryRef.current.length > 0) {
      const lastState = strokesHistoryRef.current.pop();
      if (lastState) {
        ctx.putImageData(lastState, 0, 0);
        setCanvasStrokesCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Bar: Character Meta, Mode Switcher & Universal Search */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-xl">
        {/* Active Character Identity Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center font-serif text-2xl font-black text-emerald-400 shadow-inner">
            {selectedChar.character}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-sky-400">{selectedChar.pinyin}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 font-mono">
                Radical: <strong className="text-emerald-400 font-serif">{selectedChar.radical}</strong>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 font-mono">
                {selectedChar.strokeCount} strokes
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 font-mono">
                HSK {selectedChar.hskLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-sm mt-0.5">{selectedChar.meaning}</p>
          </div>
        </div>

        {/* View Mode Switcher (Modern Dropdown Selector with quick icons) */}
        <div className="flex items-center gap-3">
          <ModernDropdown<WritingViewMode>
            value={viewMode}
            onChange={(mode) => {
              setViewMode(mode);
              setIsPlayingAnimation(false);
            }}
            accentColor="emerald"
            options={[
              {
                id: 'strokeGuide',
                label: 'Stroke Breakdown',
                chinese: '笔顺分解',
                sublabel: 'Step-by-step vector order and directional animations',
                icon: Layers,
              },
              {
                id: 'tracingQuiz',
                label: 'Interactive Tracing',
                chinese: '描红自测',
                sublabel: 'Real-time HanziWriter stroke grading & evaluation',
                icon: Sparkles,
              },
              {
                id: 'tingxie',
                label: 'Tingxie Dictation',
                chinese: '听写记忆',
                sublabel: 'Audio dictation recall & blind stroke testing',
                icon: PenTool,
              },
              {
                id: 'chengyu',
                label: 'Chengyu Masterclass',
                chinese: '成语故事',
                sublabel: 'Idiom stories, historical origins & stroke orders',
                icon: Award,
              },
              {
                id: 'practiceCanvas',
                label: 'Calligraphy Canvas',
                chinese: '米字格练习',
                sublabel: 'Freehand calligraphy brush with grid overlays',
                icon: PenTool,
              },
              {
                id: 'yongPrinciples',
                label: '永字八法 (8 Principles)',
                chinese: '书法八法',
                sublabel: 'Classical calligraphy anatomy on the character 永',
                icon: Compass,
              },
              {
                id: 'radicals',
                label: 'Radicals Matrix',
                chinese: '常用部首',
                sublabel: 'The fundamental semantic building blocks of Hanzi',
                icon: BookOpen,
              },
              {
                id: 'decomposition',
                label: 'Decomposition',
                chinese: '形声拆解',
                sublabel: 'Radical + phonetic compound breakdown tree',
                icon: Layers,
              },
              {
                id: 'worksheet',
                label: 'Printable Worksheet',
                chinese: '田字格字帖',
                sublabel: 'Export customizable practice sheets for paper writing',
                icon: PenTool,
              },
            ]}
          />
        </div>

        {/* Universal Character Search / Picker */}
        <form onSubmit={handleSearchCustom} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search or enter any Chinese character (e.g. 覆, 永, 道)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 sm:w-64 bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={isAnalyzingCustom}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md shadow-emerald-500/20"
          >
            {isAnalyzingCustom ? 'Loading...' : 'Study'}
          </button>
        </form>
      </div>

      {/* Preset Characters Quick Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-500 shrink-0 font-medium">Quick Select:</span>
        {CHARACTERS_DATABASE.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setSelectedChar(item);
              setCurrentStrokeIndex(0);
              setIsPlayingAnimation(false);
            }}
            className={`px-3 py-1 rounded-lg font-serif text-sm transition-all shrink-0 ${
              selectedChar.id === item.id
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            {item.character}
          </button>
        ))}
      </div>

      {/* VIEW MODE 1: STROKE ORDER GUIDE */}
      {viewMode === 'strokeGuide' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Central Character Display */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center">
            {/* Header: Action buttons & Active stroke counter */}
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400 tracking-wider">
                STROKE <strong className="text-emerald-400">{currentStrokeIndex + 1}</strong> OF{' '}
                {selectedChar.strokeSequence.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-share-character"
                  onClick={handleShare}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Share / Copy"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  id="btn-favorite-character"
                  onClick={handleToggleFavorite}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFavorited
                      ? 'text-amber-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Mark Mastered"
                >
                  <Star className={`w-4 h-4 ${isFavorited ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
                <button
                  id="btn-play-stroke-animation"
                  onClick={toggleAnimation}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isPlayingAnimation
                      ? 'bg-slate-800 text-slate-200 border border-slate-700'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                  title={isPlayingAnimation ? 'Pause Stroke Animation' : 'Play Stroke Order Animation'}
                >
                  {isPlayingAnimation ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Central Tian Zi Ge (田字格) / Mi Zi Ge with stroke & Direction Guide */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-center overflow-hidden">
              {/* Dynamic progressive stroke renderer */}
              {charStrokeData && charStrokeData.strokes.length > 0 ? (
                <StrokeStepSvg
                  strokes={charStrokeData.strokes}
                  medians={charStrokeData.medians}
                  activeStep={currentStrokeIndex}
                  gridType={gridType}
                  showDirectionArrow={true}
                  highlightColor="#34d399"
                  pastStrokeColor="#94a3b8"
                  futureStrokeColor="#334155"
                  className="w-full h-full"
                />
              ) : (
                /* Fallback character renderer */
                <div className="relative z-10 flex flex-col items-center justify-center select-none">
                  <span className="font-serif text-8xl sm:text-9xl font-bold tracking-tight text-white">
                    {selectedChar.character}
                  </span>
                </div>
              )}

              {/* Subtitle with current active stroke name */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-slate-400">Stroke {currentStrokeIndex + 1}:</span>
                <span className="font-serif text-sm font-bold text-emerald-400">
                  {selectedChar.strokeSequence[currentStrokeIndex]?.type || '笔画'}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {selectedChar.strokeSequence[currentStrokeIndex]?.name || ''}
                </span>
              </div>

              {/* Replay stroke 1 button */}
              <button
                onClick={() => {
                  setCurrentStrokeIndex(0);
                  setIsPlayingAnimation(false);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1 border border-slate-800"
                title="Restart from Stroke 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Metadata Card (Pinyin, Radical, Meaning) */}
            <div className="w-full grid grid-cols-3 gap-2 mt-3 bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
              <div className="flex flex-col items-center justify-center border-r border-slate-800/80 pr-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Pinyin</span>
                <button
                  id="btn-audio-character"
                  onClick={handlePlayAudio}
                  className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-all font-semibold"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="font-mono text-sm">{selectedChar.pinyin}</span>
                </button>
              </div>

              <div className="flex flex-col items-center justify-center border-r border-slate-800/80 px-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Radical</span>
                <span className="mt-1 font-serif text-base font-bold text-emerald-400">
                  {selectedChar.radical}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                  {selectedChar.radicalMeaning}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center pl-2">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Active Stroke</span>
                <button
                  onClick={() =>
                    handlePlayStrokeAudio(selectedChar.strokeSequence[currentStrokeIndex]?.type || '')
                  }
                  className="mt-1 flex items-center gap-1 font-serif text-base font-bold text-amber-400 hover:underline"
                  title="Listen to stroke name"
                >
                  <Volume2 className="w-3 h-3 text-amber-400" />
                  <span>{selectedChar.strokeSequence[currentStrokeIndex]?.type || '笔画'}</span>
                </button>
              </div>
            </div>

            {/* Speed & Stepper Controls */}
            <div className="w-full flex items-center justify-between mt-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <span>Speed:</span>
                <button
                  onClick={() => setAnimationSpeed(1200)}
                  className={`px-2 py-0.5 rounded ${animationSpeed === 1200 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'hover:bg-slate-800'}`}
                >
                  0.7x
                </button>
                <button
                  onClick={() => setAnimationSpeed(800)}
                  className={`px-2 py-0.5 rounded ${animationSpeed === 800 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'hover:bg-slate-800'}`}
                >
                  1.0x
                </button>
                <button
                  onClick={() => setAnimationSpeed(450)}
                  className={`px-2 py-0.5 rounded ${animationSpeed === 450 ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'hover:bg-slate-800'}`}
                >
                  1.5x
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setCurrentStrokeIndex((p) => Math.max(0, p - 1));
                    setIsPlayingAnimation(false);
                  }}
                  disabled={currentStrokeIndex === 0}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200 transition-all"
                  title="Previous stroke"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-slate-300 font-bold">
                  {currentStrokeIndex + 1} / {selectedChar.strokeSequence.length}
                </span>
                <button
                  onClick={() => {
                    setCurrentStrokeIndex((p) =>
                      Math.min(selectedChar.strokeSequence.length - 1, p + 1)
                    );
                    setIsPlayingAnimation(false);
                  }}
                  disabled={currentStrokeIndex >= selectedChar.strokeSequence.length - 1}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-200 transition-all"
                  title="Next stroke"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Stroke-by-Stroke Step Sequence Cards */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200">
                Stroke Breakdown ({selectedChar.strokeSequence.length} Steps)
              </h3>
              <span className="text-xs text-slate-400">Click any step to inspect</span>
            </div>

            {/* Grid of sequential cards */}
            <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {selectedChar.strokeSequence.map((stroke, idx) => {
                const isCurrent = idx === currentStrokeIndex;
                const isPassed = idx < currentStrokeIndex;
                return (
                  <button
                    key={stroke.step}
                    id={`stroke-step-${stroke.step}`}
                    onClick={() => {
                      setCurrentStrokeIndex(idx);
                      setIsPlayingAnimation(false);
                    }}
                    className={`relative rounded-lg p-2 flex flex-col items-center justify-between border transition-all text-center group ${
                      isCurrent
                        ? 'bg-slate-800 border-emerald-400 text-emerald-300'
                        : isPassed
                        ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Step Number */}
                    <span
                      className={`text-[10px] font-bold ${
                        isCurrent ? 'text-emerald-400 font-black' : 'text-slate-500'
                      }`}
                    >
                      {stroke.step}
                    </span>

                    {/* Miniature Tian Zi Ge with Progressive Stroke preview */}
                    <div className="relative w-12 h-12 my-1 flex items-center justify-center rounded bg-slate-950 border border-slate-800/80 overflow-hidden">
                      {charStrokeData && charStrokeData.strokes.length > 0 ? (
                        <StrokeStepSvg
                          strokes={charStrokeData.strokes}
                          medians={charStrokeData.medians}
                          activeStep={idx}
                          gridType="mizige"
                          highlightColor="#34d399"
                          pastStrokeColor="#94a3b8"
                          className="w-full h-full"
                        />
                      ) : (
                        <span
                          className={`font-serif text-2xl font-bold select-none ${
                            isCurrent
                              ? 'text-emerald-400 scale-105'
                              : isPassed
                              ? 'text-slate-200'
                              : 'text-slate-600'
                          }`}
                        >
                          {selectedChar.character}
                        </span>
                      )}
                    </div>

                    {/* Stroke Type Label (横, 竖, 横折, 撇, 捺, etc.) */}
                    <span
                      className={`text-[11px] font-medium truncate max-w-full px-1.5 py-0.5 rounded transition-colors ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-300 group-hover:text-emerald-400'
                      }`}
                    >
                      {stroke.type}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Decomposition & Etymology context box */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Decomposition & Etymology 字源结构
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedChar.etymology}</p>

              {selectedChar.examples && selectedChar.examples.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {selectedChar.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800/80 text-xs flex items-center gap-1.5"
                    >
                      <span className="font-serif font-bold text-emerald-400">{ex.word}</span>
                      <span className="text-slate-400 text-[11px]">({ex.pinyin})</span>
                      <span className="text-slate-500 text-[11px]">- {ex.meaning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: INTERACTIVE TRACING & QUIZ (描红自测) */}
      {viewMode === 'tracingQuiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Interactive Stroke Tracing: {selectedChar.character}
                </h3>
              </div>
              <span className="text-xs text-slate-400">Draw each stroke in correct order</span>
            </div>

            {/* HanziWriter Interactive Quiz Player */}
            <HanziWriterPlayer
              character={selectedChar.character}
              mode="quiz"
              size={300}
              onQuizComplete={() => {
                showToast(`Character ${selectedChar.character} successfully written!`);
                if (onCharacterMastered) {
                  onCharacterMastered(selectedChar.character);
                }
              }}
            />
          </div>

          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Stroke Tracing Instructions
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Use your mouse or fingertip to trace each stroke directly onto the Tian Zi Ge. The engine evaluates:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-slate-200 block">Stroke Order (笔顺):</strong>
                  <span className="text-slate-400">
                    You must draw stroke #1, then stroke #2, and so on. Skipping ahead is not allowed.
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-slate-200 block">Stroke Direction (笔向):</strong>
                  <span className="text-slate-400">
                    Start where the stroke naturally enters (e.g. top-to-bottom for 竖, left-to-right for 横).
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-slate-200 block">Hints & Guidance:</strong>
                  <span className="text-slate-400">
                    Stuck? Click the "Hint" button on the canvas to flash the next stroke's path!
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Order for {selectedChar.character}
              </h5>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {selectedChar.strokeSequence.map((s) => (
                  <span
                    key={s.step}
                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1"
                  >
                    <span className="text-emerald-400 font-mono font-bold">{s.step}.</span>
                    <span>{s.type}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE: TINGXIE MEMORY DICTATION (听写自测) */}
      {viewMode === 'tingxie' && (
        <TingxieDictation onCharacterMastered={onCharacterMastered} />
      )}

      {/* VIEW MODE: CHENGYU FOUR-CHARACTER IDIOM MASTERCLASS (成语故事) */}
      {viewMode === 'chengyu' && (
        <ChengyuMasterclass
          onSelectCharacterToWrite={(char) => {
            loadCharacter(char);
            setViewMode('strokeGuide');
          }}
        />
      )}

      {/* VIEW MODE 3: CALLIGRAPHY CANVAS (临摹书写) */}
      {viewMode === 'practiceCanvas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col items-center">
            {/* Canvas Toolbar */}
            <div className="w-full flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">Grid:</span>
                <button
                  onClick={() => setGridType('mizige')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    gridType === 'mizige'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  米字格 (Star)
                </button>
                <button
                  onClick={() => setGridType('tianzige')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    gridType === 'tianzige'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  田字格 (Cross)
                </button>
              </div>

              {/* Ghost Guide & Brush Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGhostGuide(!showGhostGuide)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border ${
                    showGhostGuide
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {showGhostGuide ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showGhostGuide ? 'Ghost ON' : 'Ghost OFF'}</span>
                </button>

                {/* Ink Color Selector */}
                <div className="flex items-center gap-1 ml-2">
                  {[
                    { color: '#34d399', name: 'Emerald' },
                    { color: '#f43f5e', name: 'Cinnabar' },
                    { color: '#fbbf24', name: 'Gold' },
                    { color: '#f8fafc', name: 'Pure White' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setBrushColor(c.color)}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        brushColor === c.color ? 'ring-2 ring-white scale-110' : 'border-slate-700'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => setBrushSize(6)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      brushSize === 6 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    S
                  </button>
                  <button
                    onClick={() => setBrushSize(12)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      brushSize === 12 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => setBrushSize(20)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      brushSize === 20 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    L
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Canvas */}
            <div className="relative touch-none flex flex-col items-center">
              {/* Stroke Order Guide while Tracing */}
              <div className="mb-2 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-slate-400">Stroke {Math.min(canvasStrokesCount + 1, selectedChar.strokeSequence.length)} of {selectedChar.strokeSequence.length}:</span>
                <span className="font-serif font-bold text-white text-sm">
                  {selectedChar.strokeSequence[Math.min(canvasStrokesCount, selectedChar.strokeSequence.length - 1)]?.type || '笔画'}
                </span>
                <span className="text-xs text-slate-400">
                  {selectedChar.strokeSequence[Math.min(canvasStrokesCount, selectedChar.strokeSequence.length - 1)]?.name || ''}
                </span>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={360}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] cursor-crosshair"
                />
              </div>
            </div>

            {/* Canvas Actions */}
            <div className="w-full flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndo}
                  disabled={canvasStrokesCount === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-200 transition-all"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
                <button
                  onClick={initCanvas}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-medium text-rose-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">
                  Strokes drawn: <strong className="text-emerald-400">{canvasStrokesCount}</strong> /{' '}
                  {selectedChar.strokeCount}
                </span>
                <button
                  onClick={() => {
                    confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
                    showToast(`Well done writing ${selectedChar.character}!`);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Done</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stroke Checklist & Writing Rules */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Writing Checklist for {selectedChar.character}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trace or freehand the character in the grid. Follow the standard Chinese stroke order rules:
            </p>

            <ul className="text-xs text-slate-300 space-y-2 pl-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Top before bottom (从上到下)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Left before right (从左到右)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Horizontal before vertical (先横后竖)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Outside before inside (从外到内)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Inside before closing bottom (先进后关)</span>
              </li>
            </ul>

            <div className="pt-3 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Stroke Breakdown Order
              </h4>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {selectedChar.strokeSequence.map((s) => (
                  <div
                    key={s.step}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950 text-xs border border-slate-800/60"
                  >
                    <span className="font-mono text-emerald-400 font-bold">#{s.step}</span>
                    <span className="font-serif font-semibold text-slate-200">{s.type}</span>
                    <span className="text-slate-400 text-[11px]">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: 永字八法 (EIGHT PRINCIPLES OF YONG CALLIGRAPHY) */}
      {viewMode === 'yongPrinciples' && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                The Eight Principles of Yong (永字八法)
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                The ancient calligraphic canon: The single character <strong>永 (Yǒng - Eternity)</strong>{' '}
                synthesizes the 8 fundamental stroke archetypes of Chinese writing. Master these 8 strokes and you can write any of the 80,000+ Chinese characters.
              </p>
            </div>
            <button
              onClick={() => {
                const yong = CHARACTERS_DATABASE.find((c) => c.character === '永');
                if (yong) {
                  setSelectedChar(yong);
                  setViewMode('strokeGuide');
                  setCurrentStrokeIndex(0);
                }
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 shrink-0"
            >
              <span>Practice 永 in Stroke Guide</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Interactive Principles Cards Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {YONG_PRINCIPLES.map((principle) => {
                const isSelected = selectedPrincipleId === principle.id;
                return (
                  <div
                    key={principle.id}
                    onClick={() => setSelectedPrincipleId(principle.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-serif text-2xl font-black text-emerald-400">
                          {principle.traditionalName}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                          {principle.strokeType} ({principle.pinyin})
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100">{principle.name}</h4>
                      <p className="text-xs text-amber-300/90 italic mt-1 leading-snug">
                        "{principle.metaphor}"
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80">
                      <p className="text-[11px] text-slate-400 leading-relaxed">{principle.technique}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Central Yong Archetype Visualizer */}
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-between">
              <div className="w-full text-center">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Calligraphic Archetype
                </span>
                <h4 className="text-sm font-bold text-slate-200 mt-1">永 (Yǒng) - Eternity</h4>
              </div>

              {/* Tian Zi Ge display for 永 */}
              <div className="relative w-56 h-56 my-4 bg-slate-900 rounded-xl border border-emerald-500/30 p-2 shadow-inner flex items-center justify-center">
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
                  viewBox="0 0 100 100"
                >
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#10b981" strokeWidth="0.8" strokeDasharray="3,3" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#10b981" strokeWidth="0.8" strokeDasharray="3,3" />
                  <line x1="0" y1="0" x2="100" y2="100" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="100" y1="0" x2="0" y2="100" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2,2" />
                </svg>

                {PRECACHED_STROKES['永'] ? (
                  <StrokeStepSvg
                    strokes={PRECACHED_STROKES['永'].strokes}
                    medians={PRECACHED_STROKES['永'].medians}
                    activeStep={YONG_PRINCIPLES.find((p) => p.id === selectedPrincipleId)?.strokeIndex || 0}
                    gridType="mizige"
                    showDirectionArrow={true}
                    highlightColor="#f59e0b"
                    pastStrokeColor="#94a3b8"
                    className="w-full h-full"
                  />
                ) : (
                  <span className="font-serif text-8xl font-black text-white">永</span>
                )}
              </div>

              <div className="w-full text-center p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block mb-1">Selected Principle:</span>
                <strong className="text-amber-400 font-serif text-base block">
                  {YONG_PRINCIPLES.find((p) => p.id === selectedPrincipleId)?.traditionalName}
                </strong>
                <span className="text-slate-300 text-[11px]">
                  {YONG_PRINCIPLES.find((p) => p.id === selectedPrincipleId)?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 5: RADICALS EXPLORER */}
      {viewMode === 'radicals' && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl">
          <div className="pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Essential Chinese Radicals (部首)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Radicals are the structural building blocks of Chinese characters. Recognizing radicals allows you to infer meaning and lookup characters easily.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RADICALS_LIST.map((rad, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif text-3xl font-black text-emerald-400 group-hover:scale-110 transition-transform">
                      {rad.radical}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {rad.strokeCount} strokes
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{rad.pinyin}</h4>
                  <p className="text-xs text-emerald-300 font-medium mb-1.5">{rad.meaning}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{rad.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/70">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                    Sample Characters:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {rad.examples.map((char, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => {
                          const match = CHARACTERS_DATABASE.find((c) => c.character === char);
                          if (match) {
                            setSelectedChar(match);
                            setCurrentStrokeIndex(0);
                            setViewMode('strokeGuide');
                          } else {
                            // Trigger dynamic character load
                            setSearchQuery(char);
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs font-serif font-bold text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {viewMode === 'decomposition' && (
        <RadicalDecompositionExplorer
          onSelectCharacterToWrite={(char) => {
            const found = CHARACTERS_DATABASE.find((c) => c.character === char);
            if (found) {
              setSelectedChar(found);
              setCurrentStrokeIndex(0);
              setViewMode('strokeGuide');
            } else {
              loadCharacter(char);
              setViewMode('strokeGuide');
            }
          }}
        />
      )}

      {viewMode === 'worksheet' && (
        <TianZiGeWorksheet
          onSelectCharacterToWrite={(char) => {
            const found = CHARACTERS_DATABASE.find((c) => c.character === char);
            if (found) {
              setSelectedChar(found);
              setCurrentStrokeIndex(0);
              setViewMode('strokeGuide');
            } else {
              loadCharacter(char);
              setViewMode('strokeGuide');
            }
          }}
        />
      )}
    </div>
  );
};
