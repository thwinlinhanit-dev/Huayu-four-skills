import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Volume2,
  RefreshCw,
  FileText,
  HelpCircle,
  PenTool,
} from 'lucide-react';
import { ReadingStory } from '../types';
import { playMandarinAudio } from '../utils/audio';

interface CustomLessonCreatorProps {
  onSaveStory: (story: ReadingStory) => void;
  onSelectCharacterToWrite?: (char: string) => void;
}

export const CustomLessonCreator: React.FC<CustomLessonCreatorProps> = ({
  onSaveStory,
  onSelectCharacterToWrite,
}) => {
  const [titleChinese, setTitleChinese] = useState<string>('我的北京旅行日记');
  const [titlePinyin, setTitlePinyin] = useState<string>('Wǒ de Běijīng Lǚxíng Rìjì');
  const [titleEnglish, setTitleEnglish] = useState<string>('My Beijing Travel Journal');
  const [hskLevel, setHskLevel] = useState<number>(3);
  const [category, setCategory] = useState<string>('Travel & Life');

  const [paragraphChinese, setParagraphChinese] = useState<string>(
    '今天我和朋友一起去爬了八达岭长城。天空中飘着几朵白云，阳光很温暖。站在山顶上，我们看见群山连绵起伏，非常壮观。我们拍了很多好看的照片。'
  );
  const [paragraphEnglish, setParagraphEnglish] = useState<string>(
    'Today my friends and I climbed the Badaling Great Wall together. White clouds floated in the sky and the sun was warm. Standing at the mountain peak, we saw undulating mountains—it was truly spectacular. We took many beautiful photos.'
  );

  const [isGeneratingPinyin, setIsGeneratingPinyin] = useState<boolean>(false);
  const [generatedTokens, setGeneratedTokens] = useState<Array<{ char: string; pinyin: string; meaning: string }>>([]);

  const [q1Question, setQ1Question] = useState<string>('作者今天和朋友一起去了哪里？ (Where did the author and friends go today?)');
  const [q1Opt1, setQ1Opt1] = useState<string>('颐和园 (Summer Palace)');
  const [q1Opt2, setQ1Opt2] = useState<string>('八达岭长城 (Badaling Great Wall)');
  const [q1Opt3, setQ1Opt3] = useState<string>('故宫博物院 (Forbidden City)');
  const [q1Opt4, setQ1Opt4] = useState<string>('天坛公园 (Temple of Heaven)');
  const [q1Correct, setQ1Correct] = useState<number>(1);
  const [q1Explanation, setQ1Explanation] = useState<string>('第一句话指出：“今天我和朋友一起去爬了八达岭长城”。');

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Auto-tokenize through server API
  const handleAutoAnalyze = async () => {
    if (!paragraphChinese.trim()) return;
    setIsGeneratingPinyin(true);
    try {
      const res = await fetch('/api/text/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: paragraphChinese }),
      });
      const data = await res.json();
      if (data && data.tokens && Array.isArray(data.tokens)) {
        setGeneratedTokens(data.tokens);
        if (data.englishTranslation && !paragraphEnglish.trim()) {
          setParagraphEnglish(data.englishTranslation);
        }
        if (typeof data.overallHsk === 'number') {
          setHskLevel(Math.min(6, Math.max(1, data.overallHsk)));
        }
      }
    } catch (err) {
      console.error('Failed to tokenize text:', err);
    } finally {
      setIsGeneratingPinyin(false);
    }
  };

  const handleSave = () => {
    if (!titleChinese.trim() || !paragraphChinese.trim()) return;

    // Tokens fallback if not analyzed yet
    const tokens =
      generatedTokens.length > 0
        ? generatedTokens
        : paragraphChinese
            .split(/([，。！？\s]+)/)
            .filter((s) => s.trim().length > 0)
            .map((chunk) => ({
              char: chunk,
              pinyin: '',
              meaning: '',
            }));

    const newStory: ReadingStory = {
      id: `custom-story-${Date.now()}`,
      titleChinese: titleChinese.trim(),
      titlePinyin: titlePinyin.trim() || titleChinese.trim(),
      titleEnglish: titleEnglish.trim() || 'Custom Reading Lesson',
      hskLevel: hskLevel as any,
      category: category.trim() || 'Custom',
      paragraphs: [
        {
          chinese: paragraphChinese.trim(),
          pinyin: tokens.map((t) => t.pinyin).filter(Boolean).join(' ') || titlePinyin,
          english: paragraphEnglish.trim(),
          wordTokens: tokens,
        },
      ],
      questions: [
        {
          question: q1Question.trim(),
          options: [q1Opt1.trim(), q1Opt2.trim(), q1Opt3.trim(), q1Opt4.trim()],
          correctIndex: q1Correct,
          explanation: q1Explanation.trim(),
        },
      ],
    };

    onSaveStory(newStory);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">Custom Lesson Creator (自定义课程与文章制作)</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Author your own reading passage, paste an article, or generate interactive tokenized quizzes with one click.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Lesson added to Graded Stories!</span>
          </div>
        )}
      </div>

      {/* Lesson Metadata Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Chinese Title (中文标题)</label>
          <input
            type="text"
            value={titleChinese}
            onChange={(e) => setTitleChinese(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-serif"
            placeholder="e.g. 喝茶的艺术"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Pinyin Title (拼音标题)</label>
          <input
            type="text"
            value={titlePinyin}
            onChange={(e) => setTitlePinyin(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono"
            placeholder="e.g. Hē Chá de Yìshù"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">English Title (英文标题)</label>
          <input
            type="text"
            value={titleEnglish}
            onChange={(e) => setTitleEnglish(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            placeholder="e.g. The Art of Tea"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Target HSK</label>
            <select
              value={hskLevel}
              onChange={(e) => setHskLevel(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {[1, 2, 3, 4, 5, 6].map((l) => (
                <option key={l} value={l}>
                  HSK {l}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Travel"
            />
          </div>
        </div>
      </div>

      {/* Passage Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-400">
            Passage Content (文章正文 - 支持多句中文)
          </label>
          <button
            type="button"
            onClick={handleAutoAnalyze}
            disabled={isGeneratingPinyin || !paragraphChinese.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPinyin ? 'animate-spin' : ''}`} />
            <span>{isGeneratingPinyin ? 'Segmenting with AI...' : 'Auto-Generate Pinyin & Tokens'}</span>
          </button>
        </div>

        <textarea
          rows={4}
          value={paragraphChinese}
          onChange={(e) => setParagraphChinese(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-base text-slate-100 font-serif leading-relaxed focus:outline-none focus:border-emerald-500"
          placeholder="输入中文文章段落..."
        />

        {/* English Translation */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            English Translation (英文翻译 - 可选，自动生成)
          </label>
          <textarea
            rows={2}
            value={paragraphEnglish}
            onChange={(e) => setParagraphEnglish(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            placeholder="English translation of the passage..."
          />
        </div>

        {/* Live Token Preview */}
        {generatedTokens.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">
              Interactive Vocabulary Preview ({generatedTokens.length} Tokens)
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {generatedTokens.map((tok, i) => (
                <div
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-left flex flex-col items-start hover:border-emerald-500/50 transition-all cursor-pointer group"
                  onClick={() => onSelectCharacterToWrite && onSelectCharacterToWrite(tok.char[0])}
                  title="Click to practice writing first character"
                >
                  <span className="text-[10px] text-emerald-400 font-mono">{tok.pinyin}</span>
                  <span className="font-serif text-base text-slate-100 group-hover:text-emerald-300">
                    {tok.char}
                  </span>
                  <span className="text-[10px] text-slate-400 max-w-[120px] truncate">{tok.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comprehension Quiz Question Form */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          Comprehension Question (配套阅读理解题)
        </h4>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Question Prompt (题目)</label>
          <input
            type="text"
            value={q1Question}
            onChange={(e) => setQ1Question(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { val: q1Opt1, set: setQ1Opt1, idx: 0, label: 'Option A' },
            { val: q1Opt2, set: setQ1Opt2, idx: 1, label: 'Option B' },
            { val: q1Opt3, set: setQ1Opt3, idx: 2, label: 'Option C' },
            { val: q1Opt4, set: setQ1Opt4, idx: 3, label: 'Option D' },
          ].map((opt) => (
            <div key={opt.idx} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctOpt"
                checked={q1Correct === opt.idx}
                onChange={() => setQ1Correct(opt.idx)}
                className="accent-emerald-500 w-4 h-4 cursor-pointer"
                title="Mark as correct answer"
              />
              <input
                type="text"
                value={opt.val}
                onChange={(e) => opt.set(e.target.value)}
                placeholder={opt.label}
                className={`w-full bg-slate-900 border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none ${
                  q1Correct === opt.idx ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-800'
                }`}
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Answer Explanation (解析)</label>
          <input
            type="text"
            value={q1Explanation}
            onChange={(e) => setQ1Explanation(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!titleChinese.trim() || !paragraphChinese.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Save & Add to Reading Lessons</span>
        </button>
      </div>
    </div>
  );
};
