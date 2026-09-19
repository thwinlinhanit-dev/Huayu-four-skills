import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle2, Award, Info, Sparkles } from 'lucide-react';
import { playMandarinAudio } from '../utils/audio';

interface ToneTarget {
  toneNum: 1 | 2 | 3 | 4;
  pinyin: string;
  hanzi: string;
  meaning: string;
  name: string;
  contour5Scale: number[]; // e.g. [5, 5] for 1st tone, [3, 5] for 2nd, [2, 1, 4] for 3rd, [5, 1] for 4th
  color: string;
  tip: string;
}

const TONE_TARGETS: ToneTarget[] = [
  {
    toneNum: 1,
    pinyin: 'mā',
    hanzi: '妈',
    meaning: 'Mother',
    name: '1st Tone: High & Level (阴平 55)',
    contour5Scale: [5, 5, 5, 5, 5],
    color: '#06b6d4', // cyan
    tip: 'Keep your vocal pitch steady and high, like singing a soprano note "laaa". Don\'t let it drop!',
  },
  {
    toneNum: 2,
    pinyin: 'má',
    hanzi: '麻',
    meaning: 'Hemp / Numb',
    name: '2nd Tone: Rising (阳平 35)',
    contour5Scale: [3, 3.5, 4, 4.5, 5],
    color: '#10b981', // emerald
    tip: 'Start at a mid pitch and glide upward quickly, exactly like asking "Huh?!" or "Really?" in English.',
  },
  {
    toneNum: 3,
    pinyin: 'mǎ',
    hanzi: '马',
    meaning: 'Horse',
    name: '3rd Tone: Low Dipping (上声 214)',
    contour5Scale: [2.5, 1.8, 1.0, 2.2, 4.0],
    color: '#8b5cf6', // purple
    tip: 'Drop deep into vocal fry at the lowest point of your vocal range, then flick back up gently.',
  },
  {
    toneNum: 4,
    pinyin: 'mà',
    hanzi: '骂',
    meaning: 'To Scold',
    name: '4th Tone: Sharp Falling (去声 51)',
    contour5Scale: [5, 4.0, 3.0, 2.0, 1.0],
    color: '#f59e0b', // amber
    tip: 'Start high and drop sharply with forceful emphasis, like a karate chop "Hi-ya!" or commanding "No!"',
  },
];

export const PitchComparator: React.FC = () => {
  const [selectedToneIdx, setSelectedToneIdx] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [userPitchPoints, setUserPitchPoints] = useState<{ x: number; pitch: number }[]>([]);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);

  const currentTarget = TONE_TARGETS[selectedToneIdx];

  // Auto-correlate pitch detector
  const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
    let SIZE = buffer.length;
    let sumOfSquares = 0;
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      sumOfSquares += val * val;
    }
    const rootMeanSquare = Math.sqrt(sumOfSquares / SIZE);
    if (rootMeanSquare < 0.015) return -1; // Too quiet / background noise

    // Find auto correlation peaks
    let r1 = 0, r2 = SIZE - 1;
    const threshold = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < threshold) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < threshold) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmedBuffer = buffer.slice(r1, r2);
    const c = new Array(trimmedBuffer.length).fill(0);
    for (let i = 0; i < trimmedBuffer.length; i++) {
      for (let j = 0; j < trimmedBuffer.length - i; j++) {
        c[i] = c[i] + trimmedBuffer[j] * trimmedBuffer[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < trimmedBuffer.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    // Interpolation for fractional period
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  };

  const startListening = async () => {
    try {
      setUserPitchPoints([]);
      setMatchScore(null);
      setFeedbackMessage('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);

      const buffer = new Float32Array(analyser.fftSize);
      const recordedPoints: { x: number; pitch: number }[] = [];
      const startTime = performance.now();
      const recordingDuration = 1600; // ms

      const samplePitch = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const pitch = autoCorrelate(buffer, audioCtx.sampleRate);
        const elapsed = performance.now() - startTime;
        const normalizedX = Math.min(1, elapsed / recordingDuration);

        // Filter human voice fundamental frequency range (75Hz - 450Hz)
        if (pitch > 70 && pitch < 480) {
          recordedPoints.push({ x: normalizedX, pitch });
          setUserPitchPoints([...recordedPoints]);
        }

        if (elapsed < recordingDuration) {
          animFrameRef.current = requestAnimationFrame(samplePitch);
        } else {
          stopListening(recordedPoints);
        }
      };

      animFrameRef.current = requestAnimationFrame(samplePitch);
    } catch (err) {
      console.error('Microphone error:', err);
      setIsRecording(false);
      setFeedbackMessage('Microphone access denied or unsupported.');
    }
  };

  const stopListening = (points?: { x: number; pitch: number }[]) => {
    setIsRecording(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }

    const data = points || userPitchPoints;
    evaluateTone(data);
  };

  const evaluateTone = (points: { x: number; pitch: number }[]) => {
    if (points.length < 5) {
      setFeedbackMessage('Too short or faint. Speak louder and hold the vowel slightly longer.');
      setMatchScore(45);
      return;
    }

    // Convert raw Hz into normalized relative pitch (1 to 5 scale)
    const pitches = points.map((p) => p.pitch);
    const minP = Math.min(...pitches);
    const maxP = Math.max(...pitches);
    const range = Math.max(25, maxP - minP);

    const firstPitch = pitches[0];
    const lastPitch = pitches[pitches.length - 1];
    const midPitch = pitches[Math.floor(pitches.length / 2)];

    let score = 75;
    let message = 'Good effort!';

    if (currentTarget.toneNum === 1) {
      // Expect level pitch with little variance
      const variance = range;
      if (variance < 35) {
        score = 96;
        message = 'Flawless! Excellent high, flat pitch stability!';
      } else {
        score = 72;
        message = 'Slightly unsteady. Keep it flat like singing a single note without wavering.';
      }
    } else if (currentTarget.toneNum === 2) {
      // Expect rising (last > first)
      if (lastPitch > firstPitch + 25) {
        score = 94;
        message = 'Great rising inflection! Exactly like the English "Huh?!" tone.';
      } else {
        score = 68;
        message = 'Rise was too weak. Push your pitch higher towards the end.';
      }
    } else if (currentTarget.toneNum === 3) {
      // Expect dipping (mid is lower than first and last)
      if (midPitch < firstPitch - 15 && lastPitch > midPitch + 10) {
        score = 95;
        message = 'Outstanding low-dip! Clear drop into your lower register.';
      } else {
        score = 70;
        message = 'Remember to plunge low first before rising slightly at the end.';
      }
    } else if (currentTarget.toneNum === 4) {
      // Expect falling (first > last)
      if (firstPitch > lastPitch + 30) {
        score = 98;
        message = 'Sharp and definitive fall! Perfect 4th tone punch.';
      } else {
        score = 65;
        message = 'Start higher and let the sound drop firmly and decisively.';
      }
    }

    setMatchScore(score);
    setFeedbackMessage(message);
  };

  // Draw target contour & recorded pitch contour onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 25, right: 30, bottom: 30, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    // Background Chao 5-degree grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';

    const levels = [
      { num: 5, label: '5 (High 高)' },
      { num: 4, label: '4 (Half-High 半高)' },
      { num: 3, label: '3 (Mid 中)' },
      { num: 2, label: '2 (Half-Low 半低)' },
      { num: 1, label: '1 (Low 低)' },
    ];

    levels.forEach((lvl) => {
      const y = padding.top + ((5 - lvl.num) / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(lvl.label, 4, y + 3);
    });

    // Draw Native Reference Target Contour
    const targetPoints = currentTarget.contour5Scale;
    ctx.strokeStyle = currentTarget.color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();

    targetPoints.forEach((val, idx) => {
      const x = padding.left + (idx / (targetPoints.length - 1)) * chartW;
      const y = padding.top + ((5 - val) / 4) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points on target contour
    targetPoints.forEach((val, idx) => {
      const x = padding.left + (idx / (targetPoints.length - 1)) * chartW;
      const y = padding.top + ((5 - val) / 4) * chartH;
      ctx.fillStyle = currentTarget.color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw User Recorded Pitch
    if (userPitchPoints.length > 1) {
      const pitches = userPitchPoints.map((p) => p.pitch);
      const minP = Math.min(...pitches);
      const maxP = Math.max(...pitches);
      const pitchSpan = Math.max(30, maxP - minP);

      ctx.strokeStyle = '#f43f5e'; // Rose pink user line
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();

      userPitchPoints.forEach((p, idx) => {
        const x = padding.left + p.x * chartW;
        // Map relative user pitch into the 1 to 5 grid
        const normalizedPitchVal = 1.5 + ((p.pitch - minP) / pitchSpan) * 3;
        const clampedVal = Math.max(1, Math.min(5, normalizedPitchVal));
        const y = padding.top + ((5 - clampedVal) / 4) * chartH;

        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }
  }, [currentTarget, userPitchPoints]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Acoustic Pitch Tracker
            </span>
            <span className="text-xs text-slate-400">Real-time F0 Web Audio Analysis</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 mt-1">Tone Contour Comparator · 音调对比仪</h3>
        </div>

        {/* Listen to Native Audio Button */}
        <button
          onClick={() => playMandarinAudio(currentTarget.hanzi, 0.85)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-all text-xs font-semibold"
        >
          <Volume2 className="w-4 h-4 text-purple-400" />
          <span>Listen Native Model ({currentTarget.pinyin})</span>
        </button>
      </div>

      {/* Tone Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TONE_TARGETS.map((t, idx) => (
          <button
            key={t.toneNum}
            onClick={() => {
              setSelectedToneIdx(idx);
              setUserPitchPoints([]);
              setMatchScore(null);
              setFeedbackMessage('');
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedToneIdx === idx
                ? 'bg-purple-500/15 border-purple-500/60 shadow-md shadow-purple-500/10'
                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Tone {t.toneNum}</span>
              <span className="text-sm font-serif font-black" style={{ color: t.color }}>
                {t.hanzi}
              </span>
            </div>
            <div className="text-base font-bold text-slate-100 font-mono mt-0.5">{t.pinyin}</div>
            <div className="text-[11px] text-slate-400 truncate">{t.meaning}</div>
          </button>
        ))}
      </div>

      {/* Target Details & Pro Tip */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-slate-200">{currentTarget.name}</div>
          <p className="text-slate-400 leading-relaxed">{currentTarget.tip}</p>
        </div>
      </div>

      {/* Dual Pitch Visualizer Canvas */}
      <div className="relative bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-hidden">
        {/* Canvas Legend */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pb-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded" style={{ backgroundColor: currentTarget.color }} />
              <span className="text-slate-300 font-medium">Native Model Contour</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded border-b-2 border-rose-500 border-dashed" />
              <span className="text-rose-400 font-medium">Your Voice Pitch</span>
            </span>
          </div>
          <span className="text-slate-500 font-mono">Chao 5-Scale (赵元任五度标音法)</span>
        </div>

        <canvas
          ref={canvasRef}
          width={640}
          height={220}
          className="w-full h-48 sm:h-56 block rounded-lg"
        />

        {/* Live Audio indicator overlay */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Analyzing Pitch... Hold tone for 1.5s
          </div>
        )}
      </div>

      {/* Recording Control & Evaluation Results */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isRecording ? (
            <button
              onClick={startListening}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Record & Match Tone ({currentTarget.pinyin})</span>
            </button>
          ) : (
            <button
              onClick={() => stopListening()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer animate-pulse"
            >
              <MicOff className="w-4 h-4" />
              <span>Stop Recording</span>
            </button>
          )}

          {userPitchPoints.length > 0 && !isRecording && (
            <button
              onClick={() => {
                setUserPitchPoints([]);
                setMatchScore(null);
                setFeedbackMessage('');
              }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              title="Clear recording"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Score Pill & Acoustic Diagnostic */}
        {matchScore !== null && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <Award className={`w-4 h-4 ${matchScore >= 85 ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="text-xs text-slate-400">Contour Accuracy:</span>
                <span className={`text-sm font-bold font-mono ${matchScore >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {matchScore}%
                </span>
              </div>
              <p className="text-[11px] text-slate-300 italic">{feedbackMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
