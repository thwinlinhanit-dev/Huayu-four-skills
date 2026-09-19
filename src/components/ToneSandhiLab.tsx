import React, { useState } from 'react';
import { Volume2, Sparkles, CheckCircle2, XCircle, HelpCircle, Activity, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TONE_SANDHI_RULES } from '../data/chineseData';
import { ToneSandhiRule } from '../types';
import { playMandarinAudio } from '../utils/audio';

export const ToneSandhiLab: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState<ToneSandhiRule>(TONE_SANDHI_RULES[0]);

  // Mini quiz state
  const [quizQuestionIndex, setQuizQuestionIndex] = useState<number>(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const sandhiQuizzes = [
    {
      question: 'How is "你好" (nǐ hǎo, 3+3) actually pronounced in natural spoken speech?',
      options: ['nǐ hǎo (3+3)', 'ní hǎo (2+3)', 'nì hǎo (4+3)', 'nī hǎo (1+3)'],
      correct: 'ní hǎo (2+3)',
      explanation: 'Two consecutive 3rd tones cause the first 3rd tone to lift into a rising 2nd tone (阳平).',
      sampleAudio: '你好',
    },
    {
      question: 'How is "一个" (yī gè) pronounced when followed by the 4th-tone measure word "个"?',
      options: ['yī gè (1+4)', 'yí gè (2+4)', 'yì gè (4+4)', 'yi gè (neutral+4)'],
      correct: 'yí gè (2+4)',
      explanation: '"一" changes to a 2nd tone (yí) when followed by a 4th tone syllable.',
      sampleAudio: '一个',
    },
    {
      question: 'How is "不是" (bù shì, 4+4) pronounced when followed by another 4th tone?',
      options: ['bù shì (4+4)', 'bú shì (2+4)', 'bǔ shì (3+4)', 'bū shì (1+4)'],
      correct: 'bú shì (2+4)',
      explanation: 'The negation "不" is naturally 4th tone, but shifts to 2nd tone (bú) before any 4th tone syllable.',
      sampleAudio: '不是',
    },
    {
      question: 'In "谢谢你" (xiè xie nǐ), what tone is the second "xie"?',
      options: ['4th tone (xiè)', 'Neutral tone (轻声 ·xie)', '1st tone (xiē)', '2nd tone (xié)'],
      correct: 'Neutral tone (轻声 ·xie)',
      explanation: 'In reduplicated kinship or courtesy words like 谢谢, 妈妈, 爸爸, the second syllable becomes light and neutral.',
      sampleAudio: '谢谢',
    },
    {
      question: 'How is "我也很好" (wǒ yě hěn hǎo - four consecutive 3rd tones) grouped and pronounced?',
      options: [
        'wó yé hén hǎo (2+2+2+3)',
        'wǒ yé hén hǎo (3+2+2+3)',
        'wǒ yě hěn hǎo (3+3+3+3 strictly)',
        'wó yě hén hǎo (2+3+2+3)',
      ],
      correct: 'wó yé hén hǎo (2+2+2+3)',
      explanation: 'In 4 consecutive third tones grouped rhythmically [我也] [很好], each initial third tone raises to 2nd tone, sounding like "wó yé hén hǎo".',
      sampleAudio: '我也很好',
    },
    {
      question: 'How is "一天" (yī tiān) pronounced when followed by the 1st-tone "天"?',
      options: ['yī tiān (1+1)', 'yì tiān (4+1)', 'yí tiān (2+1)', 'yi tiān (neutral+1)'],
      correct: 'yì tiān (4+1)',
      explanation: 'When "一" precedes a 1st, 2nd, or 3rd tone syllable, its pitch drops to 4th tone (yì). It only stays 1st tone when counting (yī, èr, sān) or at the end of a sentence.',
      sampleAudio: '一天',
    },
    {
      question: 'How is "不用" (bù yòng, 4+4) pronounced when declining an offer politely?',
      options: ['bù yòng (4+4)', 'bú yòng (2+4)', 'bǔ yòng (3+4)', 'bu yòng (neutral+4)'],
      correct: 'bú yòng (2+4)',
      explanation: 'Before 4th-tone "用" (yòng), "不" changes from 4th tone to rising 2nd tone: "bú yòng" (no need / don\'t mention it).',
      sampleAudio: '不用',
    },
  ];

  const currentQuiz = sandhiQuizzes[quizQuestionIndex % sandhiQuizzes.length];

  const handlePlayWord = (text: string) => {
    playMandarinAudio(text, 0.85);
  };

  const handleQuizAnswer = (option: string) => {
    if (quizSubmitted) return;
    setSelectedQuizOption(option);
    setQuizSubmitted(true);
    if (option === currentQuiz.correct) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleNextQuiz = () => {
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    setQuizQuestionIndex((prev) => (prev + 1) % sandhiQuizzes.length);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold font-mono">
              变调 TONE SANDHI
            </span>
            <span className="text-xs text-slate-400">Natural Chinese Spoken Phonetics</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mt-1 font-serif">
            Tone Sandhi Interactive Lab (普通话变调规律)
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            In actual conversational speech, certain tones fluidly shift based on neighboring syllables to sound natural and harmonious.
          </p>
        </div>
      </div>

      {/* Rule Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TONE_SANDHI_RULES.map((rule) => {
          const isSelected = selectedRule.id === rule.id;
          return (
            <button
              key={rule.id}
              onClick={() => setSelectedRule(rule)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-purple-500/15 border-purple-500/60 shadow-lg shadow-purple-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <span className="text-[11px] font-mono text-purple-400 font-bold block mb-1">
                {rule.chineseRule}
              </span>
              <p className="text-xs font-bold text-slate-200 line-clamp-1">{rule.title}</p>
            </button>
          );
        })}
      </div>

      {/* Active Rule Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Rule Theory & Explanation */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-purple-400 font-bold">{selectedRule.chineseRule}</span>
              <h4 className="text-base font-bold text-slate-100">{selectedRule.title}</h4>
            </div>
            <Activity className="w-5 h-5 text-purple-400" />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            {selectedRule.description}
          </p>

          {/* Examples Grid */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold block">
              Auditory Practice Examples ({selectedRule.examples.length})
            </span>

            {selectedRule.examples.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-4 hover:border-purple-500/40 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-xl font-bold text-slate-100">{item.written}</span>
                    <span className="text-xs text-slate-400 font-medium">({item.meaning})</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-mono">Written: {item.writtenPinyin}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-mono font-bold text-emerald-400">Spoken: {item.spokenPinyin}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 italic pt-0.5">{item.note}</p>
                </div>

                <button
                  onClick={() => handlePlayWord(item.written)}
                  className="p-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-all"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Play Audio</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Tone Sandhi Quiz */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-wider font-bold">
                Check Your Intuition
              </span>
              <span className="text-xs text-slate-500 font-mono">
                #{quizQuestionIndex + 1} of {sandhiQuizzes.length}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-100 leading-snug mb-4">
              {currentQuiz.question}
            </p>

            <div className="space-y-2.5">
              {currentQuiz.options.map((opt, idx) => {
                const isSelected = selectedQuizOption === opt;
                const isCorrect = opt === currentQuiz.correct;
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(opt)}
                    disabled={quizSubmitted}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-mono transition-all flex items-center justify-between ${
                      quizSubmitted
                        ? isCorrect
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                          : isSelected
                          ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                        : 'bg-slate-950 border-slate-800 hover:border-purple-500/40 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span>{opt}</span>
                    {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {quizSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {quizSubmitted && (
            <div className="pt-4 border-t border-slate-800 space-y-3 animate-in fade-in">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <span className="font-bold text-purple-400">Linguistic Insight:</span>
                <p className="text-slate-300">{currentQuiz.explanation}</p>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => handlePlayWord(currentQuiz.sampleAudio)}
                  className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Hear Sample Spoken</span>
                </button>
                <button
                  onClick={handleNextQuiz}
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-lg shadow-purple-500/20 transition-all"
                >
                  Next Question →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
