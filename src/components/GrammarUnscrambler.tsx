import React, { useState } from 'react';
import { Sparkles, CheckCircle2, RotateCcw, HelpCircle, ArrowRight, Volume2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playMandarinAudio } from '../utils/audio';

interface GrammarTile {
  id: string;
  char: string;
  pinyin: string;
  role: 'Subject' | 'Time' | 'Location' | 'Manner' | 'Verb' | 'Object' | 'Particle';
}

interface GrammarExercise {
  id: string;
  english: string;
  targetSentence: string;
  targetPinyin: string;
  hskLevel: number;
  explanation: string;
  grammarPattern: string;
  tiles: GrammarTile[];
}

const GRAMMAR_EXERCISES: GrammarExercise[] = [
  {
    id: 'g-1',
    english: 'I drink coffee at the library at 9 AM.',
    targetSentence: '我早上九点在图书馆喝咖啡。',
    targetPinyin: 'Wǒ zǎoshang jiǔ diǎn zài túshūguǎn hē kāfēi.',
    hskLevel: 1,
    grammarPattern: 'Subject + Time + Location (在...) + Verb + Object',
    explanation: 'In Chinese, time and location adverbs almost always come BEFORE the main verb. Never place time or location at the end of the sentence like in English!',
    tiles: [
      { id: 't-1', char: '我', pinyin: 'wǒ', role: 'Subject' },
      { id: 't-2', char: '早上九点', pinyin: 'zǎoshang jiǔ diǎn', role: 'Time' },
      { id: 't-3', char: '在图书馆', pinyin: 'zài túshūguǎn', role: 'Location' },
      { id: 't-4', char: '喝', pinyin: 'hē', role: 'Verb' },
      { id: 't-5', char: '咖啡', pinyin: 'kāfēi', role: 'Object' },
    ],
  },
  {
    id: 'g-2',
    english: 'He wants to go to Beijing with his friends tomorrow.',
    targetSentence: '他明天跟朋友一起去北京。',
    targetPinyin: 'Tā míngtiān gēn péngyou yìqǐ qù Běijīng.',
    hskLevel: 2,
    grammarPattern: 'Subject + Time + Prepositional Companion (跟...一起) + Action Verb + Destination',
    explanation: 'Co-agent / companion phrases ("跟/和...一起") must precede the action verb "去".',
    tiles: [
      { id: 't-6', char: '他', pinyin: 'tā', role: 'Subject' },
      { id: 't-7', char: '明天', pinyin: 'míngtiān', role: 'Time' },
      { id: 't-8', char: '跟朋友一起', pinyin: 'gēn péngyou yìqǐ', role: 'Manner' },
      { id: 't-9', char: '去', pinyin: 'qù', role: 'Verb' },
      { id: 't-10', char: '北京', pinyin: 'Běijīng', role: 'Object' },
    ],
  },
  {
    id: 'g-3',
    english: 'I have already finished writing today’s Chinese homework.',
    targetSentence: '我已经写完了今天的中文作业。',
    targetPinyin: 'Wǒ yǐjīng xiě wán le jīntiān de zhōngwén zuòyè.',
    hskLevel: 3,
    grammarPattern: 'Subject + Adverb (已经) + Verb + Resultative Complement (完) + 了 + Attributive (的) + Object',
    explanation: 'Resultative complements (完 - finished) attach directly to the verb stem (写完), followed by change/completion marker 了.',
    tiles: [
      { id: 't-11', char: '我', pinyin: 'wǒ', role: 'Subject' },
      { id: 't-12', char: '已经', pinyin: 'yǐjīng', role: 'Manner' },
      { id: 't-13', char: '写完了', pinyin: 'xiě wán le', role: 'Verb' },
      { id: 't-14', char: '今天的', pinyin: 'jīntiān de', role: 'Time' },
      { id: 't-15', char: '中文作业', pinyin: 'zhōngwén zuòyè', role: 'Object' },
    ],
  },
  {
    id: 'g-4',
    english: 'Please pass me that book on the table.',
    targetSentence: '请把桌子上的那本书递给我。',
    targetPinyin: 'Qǐng bǎ zhuōzi shàng de nà běn shū dì gěi wǒ.',
    hskLevel: 4,
    grammarPattern: 'Disposal Ba-Construction: Subject + 把 + Definite Object + Verb + Direction/Indirect Object (给...)',
    explanation: 'The famous "把" (bǎ) disposal structure moves the specific direct object in front of the verb to show what happens to it.',
    tiles: [
      { id: 't-16', char: '请', pinyin: 'qǐng', role: 'Subject' },
      { id: 't-17', char: '把', pinyin: 'bǎ', role: 'Particle' },
      { id: 't-18', char: '桌子上的那本书', pinyin: 'zhuōzi shàng de nà běn shū', role: 'Object' },
      { id: 't-19', char: '递给', pinyin: 'dì gěi', role: 'Verb' },
      { id: 't-20', char: '我', pinyin: 'wǒ', role: 'Object' },
    ],
  },
  {
    id: 'g-5',
    english: 'Although learning Chinese is difficult, it is extremely interesting.',
    targetSentence: '虽然学中文很难，但是非常有意思。',
    targetPinyin: 'Suīrán xué zhōngwén hěn nán, dànshì fēicháng yǒu yìsi.',
    hskLevel: 2,
    grammarPattern: 'Conjunction Pair: 虽然 (Although) ... 但是 (But/Yet) ...',
    explanation: 'Unlike English which forbids having both "Although" and "But" in the same sentence, Chinese requires the paired conjunction (虽然...但是...)!',
    tiles: [
      { id: 't-21', char: '虽然', pinyin: 'suīrán', role: 'Particle' },
      { id: 't-22', char: '学中文', pinyin: 'xué zhōngwén', role: 'Subject' },
      { id: 't-23', char: '很难，', pinyin: 'hěn nán,', role: 'Verb' },
      { id: 't-24', char: '但是', pinyin: 'dànshì', role: 'Particle' },
      { id: 't-25', char: '非常有意思。', pinyin: 'fēicháng yǒu yìsi.', role: 'Object' },
    ],
  },
];

export const GrammarUnscrambler: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const currentEx = GRAMMAR_EXERCISES[currentIdx];

  // Shuffled bank of available tile IDs
  const [bankTileIds, setBankTileIds] = useState<string[]>(() => {
    return [...currentEx.tiles].sort(() => Math.random() - 0.5).map((t) => t.id);
  });

  // User's constructed sentence tile IDs
  const [assembledTileIds, setAssembledTileIds] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const handleSelectTile = (id: string) => {
    if (isSubmitted) return;
    setBankTileIds((prev) => prev.filter((item) => item !== id));
    setAssembledTileIds((prev) => [...prev, id]);
  };

  const handleRemoveTile = (id: string) => {
    if (isSubmitted) return;
    setAssembledTileIds((prev) => prev.filter((item) => item !== id));
    setBankTileIds((prev) => [...prev, id]);
  };

  const handleReset = () => {
    setBankTileIds([...currentEx.tiles].sort(() => Math.random() - 0.5).map((t) => t.id));
    setAssembledTileIds([]);
    setIsSubmitted(false);
    setIsCorrect(false);
    setShowExplanation(false);
  };

  const handleCheck = () => {
    const assembledText = assembledTileIds
      .map((id) => currentEx.tiles.find((t) => t.id === id)?.char)
      .join('');

    const targetClean = currentEx.targetSentence.replace(/[。，]/g, '');
    const userClean = assembledText.replace(/[。，]/g, '');

    const correct = userClean === targetClean;
    setIsCorrect(correct);
    setIsSubmitted(true);
    setShowExplanation(true);

    if (correct) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      playMandarinAudio(currentEx.targetSentence, 0.9);
    }
  };

  const handleNext = () => {
    const nextIdx = (currentIdx + 1) % GRAMMAR_EXERCISES.length;
    setCurrentIdx(nextIdx);
    const nextEx = GRAMMAR_EXERCISES[nextIdx];
    setBankTileIds([...nextEx.tiles].sort(() => Math.random() - 0.5).map((t) => t.id));
    setAssembledTileIds([]);
    setIsSubmitted(false);
    setIsCorrect(false);
    setShowExplanation(false);
  };

  // Color helper based on syntactic role
  const getRoleBadge = (role: GrammarTile['role']) => {
    switch (role) {
      case 'Subject':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Time':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Location':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Verb':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Object':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Manner':
      case 'Particle':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Grammar Syntactic Tile Drill
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              HSK {currentEx.hskLevel}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 mt-1">Sentence Order Unscrambler · 语序排列</h3>
          <p className="text-xs text-slate-400">Master Chinese time-manner-place syntax & disposal grammar structures</p>
        </div>

        {/* Progress & Next */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            {currentIdx + 1} of {GRAMMAR_EXERCISES.length}
          </span>
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <span>Next Drill</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Prompt in English */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
        <div className="text-xs uppercase font-mono text-slate-500">Target English Sentence:</div>
        <div className="text-lg font-bold text-slate-100">{currentEx.english}</div>
        <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Formula: {currentEx.grammarPattern}</span>
        </div>
      </div>

      {/* Construction Slot Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Assemble sentence here (Click a tile to remove):</span>
          {assembledTileIds.length > 0 && !isSubmitted && (
            <button onClick={handleReset} className="text-rose-400 hover:underline flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="min-h-24 p-4 rounded-xl bg-slate-950/90 border-2 border-dashed border-slate-700 flex flex-wrap items-center gap-2.5">
          {assembledTileIds.length === 0 ? (
            <div className="w-full text-center text-xs text-slate-600 italic py-4">
              Tap word tiles below in the correct Chinese grammatical order...
            </div>
          ) : (
            assembledTileIds.map((id) => {
              const tile = currentEx.tiles.find((t) => t.id === id);
              if (!tile) return null;
              return (
                <button
                  key={id}
                  onClick={() => handleRemoveTile(id)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-emerald-500/50 hover:border-rose-500 shadow-lg text-left transition-all group cursor-pointer"
                >
                  <div className="text-[10px] font-mono text-emerald-400 group-hover:text-rose-400">{tile.pinyin}</div>
                  <div className="text-base sm:text-lg font-serif font-bold text-slate-100">{tile.char}</div>
                  <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded border mt-0.5 ${getRoleBadge(tile.role)}`}>
                    {tile.role}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Available Word Bank */}
      <div className="space-y-2">
        <div className="text-xs text-slate-400">Word Bank (Tap to add to sentence):</div>
        <div className="flex flex-wrap gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
          {bankTileIds.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-2">All tiles placed! Press Check Answer below.</div>
          ) : (
            bankTileIds.map((id) => {
              const tile = currentEx.tiles.find((t) => t.id === id);
              if (!tile) return null;
              return (
                <button
                  key={id}
                  onClick={() => handleSelectTile(id)}
                  disabled={isSubmitted}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 text-left transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  <div className="text-[10px] font-mono text-emerald-400">{tile.pinyin}</div>
                  <div className="text-base sm:text-lg font-serif font-bold text-slate-200">{tile.char}</div>
                  <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded border mt-0.5 ${getRoleBadge(tile.role)}`}>
                    {tile.role}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Action Check Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={handleCheck}
          disabled={assembledTileIds.length === 0 || isSubmitted}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          Check Sentence Order
        </button>

        {isSubmitted && (
          <button
            onClick={() => playMandarinAudio(currentEx.targetSentence, 0.85)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 transition-all text-xs font-semibold"
          >
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span>Hear Native Audio</span>
          </button>
        )}
      </div>

      {/* Evaluation Feedback & Explanation */}
      {showExplanation && (
        <div
          className={`p-4 rounded-xl border space-y-2 ${
            isCorrect
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Correct! Perfect Word Order!</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-5 h-5 text-rose-400" />
                <span>Not quite. Check the Chinese syntactic structure:</span>
              </>
            )}
          </div>

          <div className="space-y-1 text-xs pt-1">
            <div>
              <span className="text-slate-400">Target Sentence: </span>
              <span className="font-serif font-bold text-sm text-slate-100">{currentEx.targetSentence}</span>
            </div>
            <div>
              <span className="text-slate-400">Pinyin: </span>
              <span className="font-mono text-emerald-400">{currentEx.targetPinyin}</span>
            </div>
            <p className="text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
              <strong className="text-emerald-400">Grammar Rule: </strong>
              {currentEx.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
