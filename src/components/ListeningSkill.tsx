import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Trophy,
  Gauge,
  Activity,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ToneQuestion, ListeningExercise } from '../types';
import { playMandarinAudio, playToneOscillator, TONE_COLORS, isTtsAvailable } from '../utils/audio';
import { TONE_QUESTIONS, LISTENING_EXERCISES, PINYIN_SOUNDS } from '../data/chineseData';
import { ToneSandhiLab } from './ToneSandhiLab';
import { MinimalPairsTrainer } from './MinimalPairsTrainer';
import { ToneContourVisualizer } from './ToneContourVisualizer';
import { SpeedRampEarTrainer } from './SpeedRampEarTrainer';
import { ModernDropdown } from './ModernDropdown';

interface ListeningSkillProps {
  onScoreUpdate?: (correct: number, total: number) => void;
}

export const ListeningSkill: React.FC<ListeningSkillProps> = ({ onScoreUpdate }) => {
  const [subTab, setSubTab] = useState<'toneTrainer' | 'contour' | 'speedRamp' | 'pinyinChart' | 'toneSandhi' | 'minimalPairs' | 'comprehension'>('toneTrainer');
  const [pinyinFilter, setPinyinFilter] = useState<'all' | 'initial' | 'simpleFinal' | 'compoundFinal' | 'nasalFinal'>('all');
  const [activePlayingSound, setActivePlayingSound] = useState<string | null>(null);

  // Tone Trainer State
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.85);

  // Comprehension State
  const [compIndex, setCompIndex] = useState<number>(0);
  const [compSelectedOption, setCompSelectedOption] = useState<number | null>(null);
  const [compSubmitted, setCompSubmitted] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);

  const currentToneQ: ToneQuestion = TONE_QUESTIONS[questionIndex % TONE_QUESTIONS.length];
  const currentComp: ListeningExercise = LISTENING_EXERCISES[compIndex % LISTENING_EXERCISES.length];

  // Combine target tone with distractors and sort by tone 1, 2, 3, 4
  const toneOptions = [
    {
      tone: currentToneQ.tone,
      character: currentToneQ.character,
      pinyin: currentToneQ.pinyin,
      meaning: currentToneQ.meaning,
    },
    ...currentToneQ.distractors,
  ].sort((a, b) => a.tone - b.tone);

  const handlePlayToneAudio = () => {
    playMandarinAudio(currentToneQ.character, playbackSpeed);
  };

  const handlePlayToneOscillator = (tone: 1 | 2 | 3 | 4) => {
    playToneOscillator(tone, 0.7);
  };

  const handleSelectTone = (tone: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(tone);
    setIsAnswerSubmitted(true);

    const isCorrect = tone === currentToneQ.tone;
    const newCorrect = isCorrect ? score.correct + 1 : score.correct;
    const newTotal = score.total + 1;
    setScore({ correct: newCorrect, total: newTotal });

    if (onScoreUpdate) {
      onScoreUpdate(newCorrect, newTotal);
    }

    if (isCorrect) {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleNextToneQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setQuestionIndex((prev) => prev + 1);
  };

  const handlePlayCompAudio = () => {
    playMandarinAudio(currentComp.audioText, playbackSpeed);
  };

  const handleCompSubmit = (optIndex: number) => {
    if (compSubmitted) return;
    setCompSelectedOption(optIndex);
    setCompSubmitted(true);

    if (optIndex === currentComp.correctIndex) {
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
    }
  };

  const handleNextComp = () => {
    setCompSelectedOption(null);
    setCompSubmitted(false);
    setShowTranscript(false);
    setCompIndex((prev) => (prev + 1) % LISTENING_EXERCISES.length);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Listening Skill · 听力训练
            </h2>
            <p className="text-xs text-slate-400">Master tone discrimination and sentence comprehension</p>
          </div>
          {!isTtsAvailable() && (
            <span
              title="This browser has no speech synthesis engine — audio buttons are disabled. Use Chrome or Edge for the full experience."
              className="ml-2 inline-flex items-center gap-1 h-6 px-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-[10px] font-bold text-amber-400"
            >
              <VolumeX className="w-3 h-3" /> No audio engine
            </span>
          )}
        </div>

        {/* Listening Mode Dropdown Selector */}
        <div className="flex items-center">
          <ModernDropdown<'toneTrainer' | 'contour' | 'speedRamp' | 'pinyinChart' | 'toneSandhi' | 'minimalPairs' | 'comprehension'>
            value={subTab}
            onChange={setSubTab}
            accentColor="sky"
            options={[
              {
                id: 'toneTrainer',
                label: 'Tone Ear Trainer',
                chinese: '声调训练',
                sublabel: 'Interactive tone recognition quiz with real-time feedback',
                icon: Activity,
              },
              {
                id: 'contour',
                label: 'Pitch Contour',
                chinese: '声调曲线',
                sublabel: 'Visual 5-degree Chao pitch scale & interactive pitch curves',
                icon: Gauge,
              },
              {
                id: 'speedRamp',
                label: 'Speed Ramping',
                chinese: '变速听力',
                sublabel: 'Gradual speed ladder from 0.7x to 1.5x native speech rate',
                icon: Gauge,
              },
              {
                id: 'pinyinChart',
                label: 'Pinyin Soundboard',
                chinese: '发音表',
                sublabel: 'Interactive grid of initials, simple & compound finals',
                icon: Volume2,
              },
              {
                id: 'toneSandhi',
                label: 'Tone Sandhi Rules',
                chinese: '变调规律',
                sublabel: '3rd-tone sandhi, 不 (bù) and 一 (yī) phonological shifts',
                icon: Sparkles,
              },
              {
                id: 'minimalPairs',
                label: 'Minimal Pairs',
                chinese: '极小对音',
                sublabel: 'Distinguish tricky sounds (zh/j, c/q, s/x, an/ang)',
                icon: Activity,
              },
              {
                id: 'comprehension',
                label: 'Dialogue Comprehension',
                chinese: '短文听力',
                sublabel: 'Real-world dialogues with native audio and questions',
                icon: Trophy,
              },
            ]}
          />
        </div>
      </div>

      {/* SUB-TAB 1: TONE EAR TRAINER */}
      {subTab === 'toneTrainer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Ear-Training Question Card */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
            {/* Speed & Stats bar */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono text-slate-400">
                QUESTION #{questionIndex + 1}
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Speed:</span>
                <button
                  onClick={() => setPlaybackSpeed(0.7)}
                  className={`px-2 py-0.5 rounded ${playbackSpeed === 0.7 ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-slate-400'}`}
                >
                  Slow 0.7x
                </button>
                <button
                  onClick={() => setPlaybackSpeed(0.85)}
                  className={`px-2 py-0.5 rounded ${playbackSpeed === 0.85 ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-slate-400'}`}
                >
                  Normal
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-300 font-medium">
              Listen to the audio and determine which tone is being spoken:
            </p>

            {/* Big Audio Play Button */}
            <div className="my-6 flex flex-col items-center">
              <button
                id="btn-play-tone-target"
                onClick={handlePlayToneAudio}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-600 to-teal-500 hover:from-sky-500 hover:to-teal-400 text-slate-950 flex flex-col items-center justify-center shadow-xl shadow-sky-950/40 transform hover:scale-105 active:scale-95 transition-all group"
              >
                <Volume2 className="w-10 h-10 group-hover:animate-pulse text-slate-950" />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 text-slate-900">
                  Tap to Hear
                </span>
              </button>

              <span className="text-xs text-slate-400 mt-3">
                Base syllable: <strong className="text-slate-200 font-mono text-sm">{currentToneQ.pinyinBase}</strong>
              </span>
            </div>

            {/* 4 Tone Choices Grid */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
              {toneOptions.map((opt) => {
                const isSelected = selectedAnswer === opt.tone;
                const isCorrect = opt.tone === currentToneQ.tone;
                const showResult = isAnswerSubmitted;

                let cardStyle = 'bg-slate-950/80 border-slate-800 hover:border-sky-500/50 text-slate-200';
                if (showResult) {
                  if (isCorrect) {
                    cardStyle = 'bg-emerald-950/40 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/30';
                  } else if (isSelected && !isCorrect) {
                    cardStyle = 'bg-rose-950/40 border-rose-400 text-rose-300';
                  } else {
                    cardStyle = 'bg-slate-950/40 border-slate-800/40 opacity-50';
                  }
                }

                return (
                  <div
                    key={opt.tone}
                    id={`btn-tone-choice-${opt.tone}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectTone(opt.tone)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isAnswerSubmitted) {
                        e.preventDefault();
                        handleSelectTone(opt.tone);
                      }
                    }}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-between transition-all select-none ${
                      isAnswerSubmitted ? 'cursor-default' : 'cursor-pointer hover:border-sky-500/50'
                    } ${cardStyle}`}
                  >
                    <span className="text-xs font-semibold text-slate-400 mb-1">Tone {opt.tone}</span>
                    <span className="font-serif text-3xl font-bold my-1 text-slate-100">{opt.character}</span>
                    <span className="text-base font-bold text-sky-400 mb-1">{opt.pinyin}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-full">{opt.meaning}</span>

                    {/* Acoustic Frequency Sample */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayToneOscillator(opt.tone);
                      }}
                      className="mt-2 text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-sky-300 flex items-center gap-1"
                      title="Play pure acoustic pitch contour"
                    >
                      <Activity className="w-3 h-3" />
                      <span>Pitch</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Answer Feedback & Next Button */}
            {isAnswerSubmitted && (
              <div className="w-full mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selectedAnswer === currentToneQ.tone ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Correct! That was Tone {currentToneQ.tone} ({currentToneQ.pinyin} - {currentToneQ.character})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
                      <XCircle className="w-5 h-5" />
                      <span>Incorrect. It was Tone {currentToneQ.tone} ({currentToneQ.pinyin})</span>
                    </div>
                  )}
                </div>

                <button
                  id="btn-next-tone-question"
                  onClick={handleNextToneQuestion}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all"
                >
                  Next Question →
                </button>
              </div>
            )}
          </div>

          {/* Tone Contour Visual Guide & Score Card */}
          <div className="lg:col-span-5 space-y-5">
            {/* Tone Score Summary */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Listening Score</h3>
                  <p className="text-xs text-slate-400">Tone accuracy rate</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-sky-400">
                  {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                </span>
                <p className="text-[11px] text-slate-400 font-mono">
                  {score.correct} / {score.total} correct
                </p>
              </div>
            </div>

            {/* Visual Tone Contour Chart (The 5-pitch scale) */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                Mandarin 4-Tone Pitch Contours
              </h3>
              <p className="text-xs text-slate-400">
                Mandarin pitch contours are classified on a 5-point scale (1 lowest, 5 highest):
              </p>

              <div className="space-y-3">
                {/* Tone 1 */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-200">1st Tone (55) ˉ</span>
                      <p className="text-[11px] text-slate-400">High, flat & level (e.g. mā 妈)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => playToneOscillator(1)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs"
                    title="Play Tone 1 Sine Pitch"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tone 2 */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-200">2nd Tone (35) ˊ</span>
                      <p className="text-[11px] text-slate-400">Mid-rising, like asking "What?" (má 麻)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => playToneOscillator(2)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs"
                    title="Play Tone 2 Sine Pitch"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tone 3 */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-200">3rd Tone (214) ˇ</span>
                      <p className="text-[11px] text-slate-400">Dipping down then rising (mǎ 马)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => playToneOscillator(3)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs"
                    title="Play Tone 3 Sine Pitch"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tone 4 */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-200">4th Tone (51) ˋ</span>
                      <p className="text-[11px] text-slate-400">Sharp falling, like an abrupt "No!" (mà 骂)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => playToneOscillator(4)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs"
                    title="Play Tone 4 Sine Pitch"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PINYIN SOUNDBOARD */}
      {subTab === 'pinyinChart' && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-sky-400" />
                Interactive Pinyin Soundboard (汉语拼音发音表)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Click any initial (声母) or final (韵母) to hear clear native Mandarin pronunciation with International Phonetic Alphabet (IPA) and sample characters.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { key: 'all', label: 'All Sounds' },
                { key: 'initial', label: 'Initials (声母)' },
                { key: 'simpleFinal', label: 'Simple Finals (单韵母)' },
                { key: 'compoundFinal', label: 'Compound (复韵母)' },
                { key: 'nasalFinal', label: 'Nasal (鼻韵母)' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPinyinFilter(tab.key as any)}
                  className={`px-3 py-1 rounded-lg transition-all font-medium ${
                    pinyinFilter === tab.key
                      ? 'bg-sky-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Soundboard Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {PINYIN_SOUNDS.filter(
              (item) => pinyinFilter === 'all' || item.category === pinyinFilter
            ).map((sound) => {
              const isPlaying = activePlayingSound === sound.symbol;
              return (
                <button
                  key={sound.symbol}
                  onClick={() => {
                    setActivePlayingSound(sound.symbol);
                    playMandarinAudio(sound.exampleChar, 0.85);
                    setTimeout(() => setActivePlayingSound(null), 1200);
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-between text-center transition-all group ${
                    isPlaying
                      ? 'bg-sky-500/20 border-sky-400 ring-2 ring-sky-400/40 scale-105'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                    <span>{sound.ipa}</span>
                    <Volume2
                      className={`w-3.5 h-3.5 transition-colors ${
                        isPlaying ? 'text-sky-400' : 'text-slate-600 group-hover:text-sky-400'
                      }`}
                    />
                  </div>

                  <span className="font-mono text-2xl font-black text-sky-400 my-1 group-hover:scale-110 transition-transform">
                    {sound.symbol}
                  </span>

                  <div className="w-full pt-2 mt-1 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-serif font-bold text-slate-200">{sound.exampleChar}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{sound.examplePinyin}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COMPREHENSION */}
      {subTab === 'comprehension' && (
        <div className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-sky-400 uppercase tracking-wider">
                Dialogue #{compIndex + 1} of {LISTENING_EXERCISES.length}
              </span>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">Real-life Audio Comprehension</h3>
            </div>
            <button
              onClick={handlePlayCompAudio}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>Play Audio Dialogue</span>
            </button>
          </div>

          {/* Question text */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Question:</span>
            <p className="text-sm font-semibold text-slate-200">{currentComp.question}</p>
          </div>

          {/* Multiple choice options */}
          <div className="space-y-2.5">
            {currentComp.options.map((opt, oIdx) => {
              const isSelected = compSelectedOption === oIdx;
              const isCorrect = oIdx === currentComp.correctIndex;
              let style = 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200';

              if (compSubmitted) {
                if (isCorrect) {
                  style = 'bg-emerald-950/40 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/30';
                } else if (isSelected && !isCorrect) {
                  style = 'bg-rose-950/40 border-rose-400 text-rose-300';
                } else {
                  style = 'bg-slate-950/50 border-slate-800/40 opacity-40';
                }
              }

              return (
                <button
                  key={oIdx}
                  onClick={() => handleCompSubmit(oIdx)}
                  disabled={compSubmitted}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${style}`}
                >
                  <span>{opt}</span>
                  {compSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {compSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Transcript toggle & Explanation after answer */}
          {compSubmitted && (
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-xs text-sky-400 hover:underline font-medium"
                >
                  {showTranscript ? 'Hide Chinese Transcript' : 'Show Chinese Transcript & Pinyin'}
                </button>
                <button
                  onClick={handleNextComp}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20"
                >
                  Next Dialogue →
                </button>
              </div>

              {showTranscript && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <p className="font-serif text-base text-slate-100 font-bold">{currentComp.chinese}</p>
                  <p className="text-xs text-sky-400 font-mono">{currentComp.pinyin}</p>
                  <p className="text-xs text-slate-400 italic">{currentComp.english}</p>
                  <p className="text-xs text-emerald-400 pt-2 border-t border-slate-800/80">
                    <strong>Tip:</strong> {currentComp.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: TONE SANDHI LAB */}
      {subTab === 'toneSandhi' && <ToneSandhiLab />}

      {/* SUB-TAB: MINIMAL PAIRS EAR TRAINING */}
      {subTab === 'minimalPairs' && <MinimalPairsTrainer />}

      {/* SUB-TAB: PITCH CONTOUR VISUALIZER */}
      {subTab === 'contour' && <ToneContourVisualizer />}

      {/* SUB-TAB: SPEED RAMP EAR TRAINER */}
      {subTab === 'speedRamp' && <SpeedRampEarTrainer />}
    </div>
  );
};
