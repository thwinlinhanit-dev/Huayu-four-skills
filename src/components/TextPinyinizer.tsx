import React, { useState } from 'react';
import { BookOpen, Volume2, Sparkles, PenTool, ExternalLink, CheckCircle2, RefreshCw } from 'lucide-react';
import { playMandarinAudio, TONE_COLORS } from '../utils/audio';

interface TextPinyinizerProps {
  onSelectCharacterToWrite?: (char: string) => void;
}

interface AnalyzedToken {
  char: string;
  pinyin: string;
  meaning: string;
  hsk?: number;
}

const SAMPLE_TEXTS = [
  {
    title: '唐诗 · 《静夜思》 (Quiet Night Thought)',
    text: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
  },
  {
    title: '唐诗 · 《春晓》 (Spring Dawn)',
    text: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
  },
  {
    title: '日常对话 · 喝茶 (Drinking Tea)',
    text: '你好！今天天气真好，我们一起去茶馆喝中国绿茶吧。',
  },
  {
    title: '成语谚语 · 熟能生巧 (Practice makes perfect)',
    text: '千里之行，始于足下。只要坚持每天练习中文，熟能生巧。',
  },
];

export const TextPinyinizer: React.FC<TextPinyinizerProps> = ({ onSelectCharacterToWrite }) => {
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXTS[0].text);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzedData, setAnalyzedData] = useState<{
    originalText: string;
    englishTranslation: string;
    overallHsk: number;
    tokens: AnalyzedToken[];
    vocabularyList: { word: string; pinyin: string; meaning: string; hsk: number }[];
  } | null>(null);

  const [selectedToken, setSelectedToken] = useState<AnalyzedToken | null>(null);

  const handleAnalyze = async (textToAnalyze = inputText) => {
    if (!textToAnalyze.trim()) return;
    setIsAnalyzing(true);
    setSelectedToken(null);

    try {
      const res = await fetch('/api/text/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToAnalyze }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalyzedData(data);
      } else {
        // Fallback
        fallbackAnalyze(textToAnalyze);
      }
    } catch {
      fallbackAnalyze(textToAnalyze);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fallbackAnalyze = (text: string) => {
    const chars = text.trim().split('');
    const tokens: AnalyzedToken[] = chars.map((c) => ({
      char: c,
      pinyin: '',
      meaning: 'Chinese character',
      hsk: 1,
    }));
    setAnalyzedData({
      originalText: text,
      englishTranslation: 'Passage loaded. Click any character to hear pronunciation or practice writing.',
      overallHsk: 1,
      tokens,
      vocabularyList: [],
    });
  };

  const handlePlayPassage = () => {
    if (analyzedData) {
      playMandarinAudio(analyzedData.originalText, 0.85);
    } else {
      playMandarinAudio(inputText, 0.85);
    }
  };

  const handlePlayWord = (word: string) => {
    playMandarinAudio(word, 0.85);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
              智能注音 PINYINIZER & HSK
            </span>
            <span className="text-xs text-slate-400">Custom Text Analyzer</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mt-1 font-serif">
            Analyze Any Chinese Text with Instant Pinyin & Vocabulary
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Paste any Chinese article, poem, or message. The engine segments words, generates tone-annotated pinyin, maps HSK levels, and links to stroke orders.
          </p>
        </div>

        <button
          onClick={handlePlayPassage}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all shrink-0"
        >
          <Volume2 className="w-4 h-4" />
          <span>Listen to Passage</span>
        </button>
      </div>

      {/* Input & Quick Presets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-mono text-slate-400 uppercase font-semibold">
            Paste Chinese Text or Select a Classic Preset:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_TEXTS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(sample.text);
                  handleAnalyze(sample.text);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors"
              >
                {sample.title.split(' · ')[1] || sample.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            placeholder="Type or paste any Chinese characters here..."
            className="flex-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-serif resize-none"
          />

          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !inputText.trim()}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0 self-stretch sm:self-auto"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Pinyinize & Analyze</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Output Result */}
      {analyzedData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Interactive Annotated Passage */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
                Annotated Reading Passage
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
                Estimated Level: HSK {analyzedData.overallHsk || 1}
              </span>
            </div>

            {/* Clickable Word Tokens with Pinyin Above */}
            <div className="flex flex-wrap gap-x-2.5 gap-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 leading-loose">
              {analyzedData.tokens.map((token, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedToken(token)}
                  className={`inline-flex flex-col items-center p-1.5 rounded-xl transition-all group ${
                    selectedToken?.char === token.char
                      ? 'bg-emerald-500/25 ring-2 ring-emerald-400/50'
                      : 'hover:bg-slate-800/80'
                  }`}
                >
                  <span className="font-mono text-[11px] text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    {token.pinyin || ''}
                  </span>
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-100 group-hover:scale-105 transition-transform">
                    {token.char}
                  </span>
                </button>
              ))}
            </div>

            {/* English Fluid Translation */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase font-bold">
                English Translation (参考译文)
              </span>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                "{analyzedData.englishTranslation}"
              </p>
            </div>
          </div>

          {/* Selected Word Inspector & Dictionary Card */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold">
                  Word Inspector (生词卡)
                </span>
                {selectedToken?.hsk && (
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                    HSK {selectedToken.hsk}
                  </span>
                )}
              </div>

              {selectedToken ? (
                <div className="space-y-4 text-center">
                  <span className="font-serif text-5xl font-black text-emerald-400 block my-2">
                    {selectedToken.char}
                  </span>
                  <span className="font-mono text-lg font-bold text-slate-200 block">
                    {selectedToken.pinyin}
                  </span>
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    {selectedToken.meaning}
                  </p>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => handlePlayWord(selectedToken.char)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Hear Spoken Audio</span>
                    </button>

                    {onSelectCharacterToWrite && selectedToken.char.length > 0 && (
                      <button
                        onClick={() => onSelectCharacterToWrite(selectedToken.char[0])}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Practice Writing Stroke Order</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs space-y-2">
                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>Click any character or word in the passage above to inspect its definition and write it!</p>
                </div>
              )}
            </div>

            {/* Vocabulary list preview */}
            {analyzedData.vocabularyList && analyzedData.vocabularyList.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-2 font-bold">
                  Key Vocabulary ({analyzedData.vocabularyList.length})
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {analyzedData.vocabularyList.map((vocab, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-serif font-bold text-slate-200 mr-2">{vocab.word}</span>
                        <span className="font-mono text-[11px] text-emerald-400">{vocab.pinyin}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{vocab.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
