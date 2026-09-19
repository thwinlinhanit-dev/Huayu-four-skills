import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ArrowRight, RotateCcw, Check, X } from 'lucide-react';
import { CHARACTERS_DATABASE, LISTENING_EXERCISES, TONE_QUESTIONS, READING_STORIES } from '../data/chineseData';
import { setPlacement } from '../utils/progressStore';
import { playMandarinAudio } from '../utils/audio';
import { SkillTab } from '../types';

interface PlacementQuizProps {
  onComplete?: (band: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onNavigateSkill?: (tab: SkillTab) => void;
}

interface QuizQuestion {
  id: string;
  prompt: string;
  chinese?: string;
  pinyin?: string;
  playAudio?: () => void;
  options: string[];
  correctIndex: number;
  band: 1 | 2 | 3 | 4 | 5 | 6;
}

function buildQuestions(): QuizQuestion[] {
  const qs: QuizQuestion[] = [];

  // Band 1: character meaning recognition
  const hsk1 = CHARACTERS_DATABASE.filter((c) => c.hskLevel === 1);
  const hsk2 = CHARACTERS_DATABASE.filter((c) => c.hskLevel === 2);
  const hsk3 = CHARACTERS_DATABASE.filter((c) => c.hskLevel === 3);
  const hsk4plus = CHARACTERS_DATABASE.filter((c) => c.hskLevel >= 4);

  const meaningQ = (chars: typeof hsk1, band: 1 | 2 | 3 | 4 | 5 | 6, id: string) => {
    if (chars.length < 4) return;
    const target = chars[Math.floor(Math.random() * chars.length)];
    const pool = [...chars].sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [target, ...pool.filter((c) => c.id !== target.id)]
      .slice(0, 4)
      .map((c) => c.meaning)
      .sort(() => Math.random() - 0.5);
    qs.push({
      id,
      prompt: 'What does this character mean?',
      chinese: target.character,
      pinyin: target.pinyin,
      options,
      correctIndex: options.indexOf(target.meaning),
      band,
    });
  };
  meaningQ(hsk1, 1, 'm1');
  meaningQ(hsk2, 2, 'm2');
  meaningQ(hsk3, 3, 'm3');
  meaningQ(hsk4plus, 4, 'm4');

  // Band 2: listening comprehension (audio → meaning)
  if (LISTENING_EXERCISES.length > 0) {
    const ex = LISTENING_EXERCISES[Math.floor(Math.random() * LISTENING_EXERCISES.length)];
    qs.push({
      id: 'l1',
      prompt: 'Listen and choose the correct translation',
      chinese: ex.chinese,
      playAudio: () => playMandarinAudio(ex.audioText),
      options: ex.options,
      correctIndex: ex.correctIndex,
      band: 2,
    });
  }

  // Band 3: tone discrimination
  if (TONE_QUESTIONS.length > 0) {
    const tq = TONE_QUESTIONS[Math.floor(Math.random() * TONE_QUESTIONS.length)];
    const toneLabels: Record<number, string> = { 1: '1st (flat)', 2: '2nd (rising)', 3: '3rd (dipping)', 4: '4th (falling)' };
    const opts = [tq, ...tq.distractors].map((o) => toneLabels[o.tone]);
    qs.push({
      id: 't1',
      prompt: `Which tone is 「${tq.character}」 (${tq.pinyinBase})?`,
      options: opts,
      correctIndex: opts.indexOf(toneLabels[tq.tone]),
      band: 3,
    });
  }

  // Band 4/5: reading comprehension
  if (READING_STORIES.length > 0) {
    const story = READING_STORIES[READING_STORIES.length - 1];
    if (story.questions.length > 0) {
      const q = story.questions[0];
      qs.push({
        id: 'r1',
        prompt: `Read: 「${story.titleChinese}」 — ${q.question}`,
        options: q.options,
        correctIndex: q.correctIndex,
        band: 4,
      });
    }
  }

  // Band 5/6: grammar / idiom depth
  const advanced = CHARACTERS_DATABASE.filter((c) => c.hskLevel >= 5);
  if (advanced.length >= 4) {
    const target = advanced[Math.floor(Math.random() * advanced.length)];
    const pool = [...advanced].sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [target, ...pool.filter((c) => c.id !== target.id)]
      .slice(0, 4)
      .map((c) => c.meaning)
      .sort(() => Math.random() - 0.5);
    qs.push({
      id: 'm5',
      prompt: 'Advanced: what does this character mean?',
      chinese: target.character,
      pinyin: target.pinyin,
      options,
      correctIndex: options.indexOf(target.meaning),
      band: 5,
    });
  }

  return qs.sort(() => Math.random() - 0.5);
}

export const PlacementQuiz: React.FC<PlacementQuizProps> = ({ onComplete, onNavigateSkill }) => {
  const [seed, setSeed] = useState<number>(0); // remount questions on retry
  const questions = useMemo(() => buildQuestions(), [seed]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [checked, setChecked] = useState<boolean[]>(() => questions.map(() => false));
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setAnswers(questions.map(() => null));
    setChecked(questions.map(() => false));
    setStep(0);
    setFinished(false);
  }, [questions]);

  const q = questions[step];
  const totalCorrect = answers.reduce<number>(
    (acc, a, i) => acc + (a !== null && a === questions[i].correctIndex ? 1 : 0),
    0
  );

  const choose = (idx: number) => {
    if (checked[step]) return;
    setAnswers((prev) => prev.map((v, i) => (i === step ? idx : v)));
    setChecked((prev) => prev.map((v, i) => (i === step ? true : v)));
  };

  const next = () => {
    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      setFinished(true);
    }
  };

  const finish = (band: 1 | 2 | 3 | 4 | 5 | 6) => {
    setPlacement(band);
    onComplete?.(band);
  };

  const retry = () => setSeed((s) => s + 1);

  if (finished) {
    const ratio = totalCorrect / questions.length;
    const band = (ratio >= 0.9 ? 6 : ratio >= 0.75 ? 5 : ratio >= 0.6 ? 4 : ratio >= 0.4 ? 3 : ratio >= 0.2 ? 2 : 1) as 1 | 2 | 3 | 4 | 5 | 6;
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-4">
        <Sparkles className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Recommended level: HSK {band}</h3>
        <p className="text-xs text-slate-400">
          You answered {totalCorrect} of {questions.length} correctly.
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={() => finish(band)}
            className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            Save & start at HSK {band}
          </button>
          <button
            onClick={retry}
            className="h-9 px-4 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Retake
          </button>
          {onNavigateSkill && (
            <button
              onClick={() => onNavigateSkill('reading')}
              className="h-9 px-4 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-xs text-slate-200 transition-colors cursor-pointer"
            >
              Skip <ArrowRight className="w-3.5 h-3.5 inline" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const answered = checked[step];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Placement · HSK band {q.band}
        </span>
        <span>
          {step + 1} / {questions.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
          style={{ width: `${((step + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <div>
        <p className="text-sm text-slate-300">{q.prompt}</p>
        {q.chinese && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-5xl font-serif font-black text-slate-100">{q.chinese}</span>
            {q.pinyin && <span className="text-sm text-slate-400">{q.pinyin}</span>}
            {q.playAudio && (
              <button
                onClick={q.playAudio}
                className="h-8 px-3 rounded-xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-xs text-sky-400 transition-colors cursor-pointer"
              >
                ▶ Play
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isPicked = answers[step] === i;
          let cls = 'border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-slate-200';
          if (answered && isCorrect) cls = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300';
          else if (answered && isPicked) cls = 'border-rose-500/60 bg-rose-500/15 text-rose-300';
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={answered}
              className={`h-10 px-4 rounded-xl border text-xs text-left transition-colors ${cls} ${
                answered ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              {answered && isCorrect && <Check className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" />}
              {answered && isPicked && !isCorrect && <X className="w-3.5 h-3.5 inline mr-1.5 text-rose-400" />}
              {opt}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={next}
          disabled={!answered}
          className="h-9 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition-colors cursor-pointer"
        >
          {step + 1 === questions.length ? 'See result' : 'Next'} <ArrowRight className="w-3.5 h-3.5 inline" />
        </button>
      </div>
    </div>
  );
};
