import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  RotateCcw,
  Zap,
  Sliders,
  Wind,
  Coffee,
  Train,
  Sparkles,
  Award,
} from 'lucide-react';
import { playMandarinAudio } from '../utils/audio';

const AUDIO_TRAINING_SENTENCES = [
  {
    id: 's-1',
    chinese: '请问去北京大学东门怎么走？',
    pinyin: 'Qǐngwèn qù Běijīng Dàxué dōngmén zěnme zǒu?',
    english: 'Excuse me, how do I get to the East Gate of Peking University?',
    hsk: 2,
  },
  {
    id: 's-2',
    chinese: '这杯奶茶我想加半糖少冰，谢谢！',
    pinyin: 'Zhè bēi nǎichá wǒ xiǎng jiā bàn táng shǎo bīng, xièxie!',
    english: 'For this milk tea I would like half sugar and less ice, thank you!',
    hsk: 3,
  },
  {
    id: 's-3',
    chinese: '师傅，麻烦前面路口靠右停一下车。',
    pinyin: 'Shīfu, máfan qiánmiàn lùkǒu kàoyòu tíng yíxià chē.',
    english: 'Driver, could you please pull over to the right at the intersection ahead?',
    hsk: 3,
  },
  {
    id: 's-4',
    chinese: '学如逆水行舟，不进则退。',
    pinyin: 'Xué rú nìshuǐ xíngzhōu, bù jìn zé tuì.',
    english: 'Learning is like rowing upstream: not to advance is to drop back.',
    hsk: 5,
  },
  {
    id: 's-5',
    chinese: '服务员，请给我们两双筷子和一壶温热的龙井茶。',
    pinyin: 'Fúwùyuán, qǐng gěi wǒmen liǎng shuāng kuàizi hé yī hú wēnrè de Lóngjǐng chá.',
    english: 'Waiter, please give us two pairs of chopsticks and a pot of warm Longjing tea.',
    hsk: 2,
  },
  {
    id: 's-6',
    chinese: '我们今天的会议主要讨论下一季度的市场推广方案。',
    pinyin: 'Wǒmen jīntiān de huìyì zhǔyào tǎolùn xià yí jìdù de shìchǎng tuīguǎng fāng\'àn.',
    english: 'Our meeting today mainly discusses the marketing promotion plan for the next quarter.',
    hsk: 4,
  },
  {
    id: 's-7',
    chinese: '世上无难事，只怕有心人。',
    pinyin: 'Shìshàng wú nánshì, zhǐ pà yǒuxīnrén.',
    english: 'Nothing in the world is difficult for one who sets their heart on it.',
    hsk: 5,
  },
];

type AmbientNoiseType = 'none' | 'cafe' | 'subway' | 'market';

export const SpeedRampEarTrainer: React.FC = () => {
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number>(0);
  const [currentSpeedStep, setCurrentSpeedStep] = useState<number>(0); // index in SPEED_STAGES
  const [isAutoRamping, setIsAutoRamping] = useState<boolean>(false);
  const [ambientNoise, setAmbientNoise] = useState<AmbientNoiseType>('none');
  const [userGuess, setUserGuess] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  const SPEED_STAGES = [
    { speed: 0.7, label: '0.7x (Slow & Clear / 慢速拆解)' },
    { speed: 0.9, label: '0.9x (Natural Learner / 常速初阶)' },
    { speed: 1.1, label: '1.1x (Native Standard / 地道常速)' },
    { speed: 1.3, label: '1.3x (Fast Conversational / 语流加速)' },
  ];

  const currentSentence = AUDIO_TRAINING_SENTENCES[selectedSentenceIndex % AUDIO_TRAINING_SENTENCES.length];

  // Ambient sound generator using Web Audio API synthetic noise & filters
  useEffect(() => {
    if (ambientNoise === 'none') {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const bufferSize = audioCtx.sampleRate * 2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate brown / pink noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const filter = audioCtx.createBiquadFilter();
      if (ambientNoise === 'cafe') {
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        filter.Q.value = 1.0;
      } else if (ambientNoise === 'subway') {
        filter.type = 'lowpass';
        filter.frequency.value = 350;
      } else if (ambientNoise === 'market') {
        filter.type = 'highpass';
        filter.frequency.value = 500;
      }

      const gain = audioCtx.createGain();
      gain.gain.value = 0.06; // Soft ambient volume

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noiseSource.start();

      noiseNodeRef.current = noiseSource;
    } catch (e) {
      console.warn('Web Audio ambient noise init failed:', e);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [ambientNoise]);

  const handlePlayCurrentSpeed = () => {
    const rate = SPEED_STAGES[currentSpeedStep].speed;
    playMandarinAudio(currentSentence.chinese, rate);
  };

  const handleStartAutoRamp = async () => {
    setIsAutoRamping(true);
    for (let i = 0; i < SPEED_STAGES.length; i++) {
      setCurrentSpeedStep(i);
      playMandarinAudio(currentSentence.chinese, SPEED_STAGES[i].speed);
      await new Promise((r) => setTimeout(r, 3400));
    }
    setIsAutoRamping(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 font-display">
            <Zap className="w-5 h-5 text-sky-400" />
            Audio Speed Ramping & Acoustic Immersion (变速耳感训练与环境拟音)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Train listening comprehension with step-by-step acceleration (0.7x $\rightarrow$ 1.3x) and optional real-world ambient acoustics.
          </p>
        </div>

        {/* Ambient Acoustics Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 pl-2">Ambient:</span>
          {[
            { id: 'none', label: 'Studio Silent', icon: Wind },
            { id: 'cafe', label: 'Tea House', icon: Coffee },
            { id: 'subway', label: 'Subway', icon: Train },
          ].map((env) => {
            const Icon = env.icon;
            return (
              <button
                key={env.id}
                onClick={() => setAmbientNoise(env.id as any)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  ambientNoise === env.id
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{env.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Training Deck */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Speed Stages Progress Bar */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Speed Gradient Ladder
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SPEED_STAGES.map((stage, idx) => {
              const isCurrent = currentSpeedStep === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentSpeedStep(idx)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-sky-950/50 border-sky-500 text-sky-200 shadow-md shadow-sky-500/10 ring-1 ring-sky-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>{stage.speed}x</span>
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-1">{stage.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Listening Target Display */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium">
            HSK Level {currentSentence.hsk} Sentence Challenge
          </div>

          <div className="py-4">
            {showAnswer ? (
              <div className="space-y-2 animate-in fade-in">
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-white">
                  {currentSentence.chinese}
                </h2>
                <p className="text-base font-semibold text-sky-400">{currentSentence.pinyin}</p>
                <p className="text-sm text-slate-300">{currentSentence.english}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-slate-500 font-mono tracking-widest text-lg sm:text-xl">
                  ● ● ● ● ● ● ● ● ● ●
                </div>
                <p className="text-xs text-slate-400">
                  Listen carefully at current speed or auto-ramp to train auditory parsing before revealing.
                </p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={handlePlayCurrentSpeed}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              Play Current ({SPEED_STAGES[currentSpeedStep].speed}x)
            </button>

            <button
              onClick={handleStartAutoRamp}
              disabled={isAutoRamping}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              {isAutoRamping ? 'Auto-Ramping 4 Speeds...' : 'Auto-Ramp All Speeds'}
            </button>

            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
            >
              {showAnswer ? 'Hide Script' : 'Reveal Script'}
            </button>
          </div>
        </div>

        {/* Sentence Selection Strip */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400">Sentence Index:</span>
          <div className="flex gap-1.5">
            {AUDIO_TRAINING_SENTENCES.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedSentenceIndex(i);
                  setShowAnswer(false);
                  setCurrentSpeedStep(0);
                }}
                className={`w-7 h-7 rounded-lg font-bold transition-all ${
                  selectedSentenceIndex === i
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
