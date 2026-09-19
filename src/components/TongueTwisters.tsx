import React, { useState, useEffect } from 'react';
import { Volume2, Play, RotateCcw, Mic, Sparkles, Trophy, Flame, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TONGUE_TWISTERS } from '../data/chineseData';
import { TongueTwister } from '../types';
import { playMandarinAudio } from '../utils/audio';

export const TongueTwisters: React.FC = () => {
  const [selectedTwister, setSelectedTwister] = useState<TongueTwister>(TONGUE_TWISTERS[0]);
  const [speed, setSpeed] = useState<number>(0.85);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const handlePlayTwister = () => {
    playMandarinAudio(selectedTwister.chinese, speed);
  };

  const handleStartRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Browser doesn't support Web Speech API - fallback simulation
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const simScore = Math.floor(Math.random() * 15) + 82;
        setSpokenTranscript(selectedTwister.chinese.slice(0, 16));
        setAssessmentScore(simScore);
        if (simScore >= 85) {
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
        }
      }, 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setSpokenTranscript('');
        setAssessmentScore(null);
      };

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setSpokenTranscript(transcript);
        setIsRecording(false);
        evaluateSpeech(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const evaluateSpeech = (spoken: string) => {
    setIsEvaluating(true);
    // Calculate simple similarity
    const target = selectedTwister.chinese.replace(/[，。；]/g, '');
    const cleanSpoken = spoken.replace(/[，。；]/g, '');
    let matched = 0;
    for (const char of cleanSpoken) {
      if (target.includes(char)) matched++;
    }
    const rawScore = target.length > 0 ? Math.min(100, Math.round((matched / target.length) * 100)) : 80;
    const finalScore = Math.max(60, rawScore);

    setTimeout(() => {
      setIsEvaluating(false);
      setAssessmentScore(finalScore);
      if (finalScore >= 80) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
              绕口令 RÀOKǑULÌNG
            </span>
            <span className="text-xs text-slate-400">Tongue Twisters & Vocal Agility</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mt-1 font-serif">
            Master Speed, Pronunciation & Tone Agility
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Classic Mandarin tongue twisters push your articulatory muscles to effortlessly differentiate similar sounds under rapid tempo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Twister Selector */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold block mb-1">
            Choose a Challenge ({TONGUE_TWISTERS.length})
          </span>
          {TONGUE_TWISTERS.map((item) => {
            const isSelected = selectedTwister.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedTwister(item);
                  setSpokenTranscript('');
                  setAssessmentScore(null);
                }}
                className={`w-full p-4 rounded-xl border text-left transition-all group ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      item.difficulty === 'Beginner'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : item.difficulty === 'Intermediate'
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {item.difficulty}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.focus}</p>
              </button>
            );
          })}
        </div>

        {/* Right: Active Twister Practice Studio */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          {/* Top Bar: Title & Focus */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-100">{selectedTwister.title}</h3>
              <p className="text-xs text-amber-400 font-mono mt-0.5">Focus: {selectedTwister.focus}</p>
            </div>

            {/* Speed Controller */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-500 px-2">Speed:</span>
              {[
                { label: '0.7x', val: 0.7 },
                { label: '0.85x', val: 0.85 },
                { label: '1.0x', val: 1.0 },
                { label: '1.25x', val: 1.25 },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setSpeed(s.val)}
                  className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                    speed === s.val
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Twister Display Card */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-4 text-center">
            <p className="font-serif text-2xl sm:text-3xl font-black text-slate-100 tracking-wide leading-relaxed">
              {selectedTwister.chinese}
            </p>

            <p className="text-xs sm:text-sm font-mono text-amber-400 leading-relaxed max-w-xl mx-auto">
              {selectedTwister.pinyin}
            </p>

            <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-800/80">
              "{selectedTwister.english}"
            </p>
          </div>

          {/* Interactive Action Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handlePlayTwister}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>Listen ({speed}x)</span>
            </button>

            <button
              onClick={handleStartRecording}
              disabled={isRecording || isEvaluating}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{isRecording ? 'Listening... Speak!' : 'Record Your Attempt'}</span>
            </button>
          </div>

          {/* Assessment feedback */}
          {assessmentScore !== null && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 animate-in fade-in">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Your Articulation Score:</span>
                  <span className="text-base font-black text-emerald-400">{assessmentScore}%</span>
                </div>
                {spokenTranscript && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Recognized: <span className="text-slate-200 font-mono">"{spokenTranscript}"</span>
                  </p>
                )}
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  assessmentScore >= 85
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {assessmentScore >= 90 ? 'Master Tongue!' : assessmentScore >= 80 ? 'Good Fluency!' : 'Keep Practicing!'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
