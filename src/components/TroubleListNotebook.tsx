import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Trash2,
  Volume2,
  PenTool,
  Download,
  CheckCircle2,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { playMandarinAudio } from '../utils/audio';

export interface LeechWord {
  id: string;
  chinese: string;
  pinyin: string;
  meaning: string;
  source: 'Quiz Mistake' | 'Reading Mining' | 'Speech Drift' | 'Manual';
  mistakeCount: number;
  dateAdded: string;
}

interface TroubleListNotebookProps {
  onSelectCharacterToWrite?: (char: string) => void;
}

const DEFAULT_LEECH_WORDS: LeechWord[] = [
  {
    id: 'l-1',
    chinese: '覆',
    pinyin: 'fù',
    meaning: 'To cover / overturn (as in 覆水难收)',
    source: 'Quiz Mistake',
    mistakeCount: 3,
    dateAdded: '2026-09-12',
  },
  {
    id: 'l-2',
    chinese: '考',
    pinyin: 'kǎo',
    meaning: 'To test / take an examination',
    source: 'Quiz Mistake',
    mistakeCount: 2,
    dateAdded: '2026-09-13',
  },
  {
    id: 'l-3',
    chinese: '四 / 十',
    pinyin: 'sì / shí',
    meaning: 'Four (4) vs Ten (10) - Retroflex minimal pair',
    source: 'Speech Drift',
    mistakeCount: 4,
    dateAdded: '2026-09-13',
  },
  {
    id: 'l-4',
    chinese: '买 / 卖',
    pinyin: 'mǎi / mài',
    meaning: 'To buy (3rd tone) vs To sell (4th tone)',
    source: 'Quiz Mistake',
    mistakeCount: 3,
    dateAdded: '2026-09-14',
  },
];

export const TroubleListNotebook: React.FC<TroubleListNotebookProps> = ({
  onSelectCharacterToWrite,
}) => {
  const [leechList, setLeechList] = useState<LeechWord[]>(() => {
    try {
      const saved = localStorage.getItem('huayu_leech_list');
      return saved ? JSON.parse(saved) : DEFAULT_LEECH_WORDS;
    } catch {
      return DEFAULT_LEECH_WORDS;
    }
  });

  const [newChar, setNewChar] = useState<string>('');
  const [newMeaning, setNewMeaning] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('huayu_leech_list', JSON.stringify(leechList));
    } catch (e) {
      console.error(e);
    }
  }, [leechList]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleRemove = (id: string) => {
    setLeechList(leechList.filter((item) => item.id !== id));
    showToast('Removed from Trouble List');
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChar.trim()) return;

    const newItem: LeechWord = {
      id: `l-${Date.now()}`,
      chinese: newChar.trim(),
      pinyin: 'pīnyīn',
      meaning: newMeaning.trim() || 'Custom saved vocabulary',
      source: 'Manual',
      mistakeCount: 1,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    setLeechList([newItem, ...leechList]);
    setNewChar('');
    setNewMeaning('');
    showToast(`Added "${newItem.chinese}" to Trouble List`);
  };

  const handleExportAnkiCsv = () => {
    // Generate standard Anki-compatible UTF-8 TSV/CSV with Front, Back, Tags
    const headers = 'Chinese\tPinyin\tMeaning\tMistakeCount\tTags\n';
    const rows = leechList
      .map(
        (w) =>
          `"${w.chinese}"\t"${w.pinyin}"\t"${w.meaning}"\t"${w.mistakeCount}"\t"HuayuChinese::TroubleList"`
      )
      .join('\n');

    const blob = new Blob([`\ufeff${headers}${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Huayu_Trouble_List_Anki_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Anki / CSV deck!');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 font-display">
            <Bookmark className="w-5 h-5 text-amber-400" />
            Trouble List & Leech Vocabulary Notebook (生词错题本与 Anki 导出)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-captured quiz mistakes, tone confusion pairs, and mined reading vocabulary. Export directly to Anki.
          </p>
        </div>

        <button
          onClick={handleExportAnkiCsv}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export to Anki / CSV Deck
        </button>
      </div>

      {/* Add New Word Form */}
      <form
        onSubmit={handleAddWord}
        className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 text-xs"
      >
        <input
          type="text"
          value={newChar}
          onChange={(e) => setNewChar(e.target.value)}
          placeholder="Chinese word (e.g. 徘徊, 饕餮)..."
          className="w-full sm:w-48 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
        />
        <input
          type="text"
          value={newMeaning}
          onChange={(e) => setNewMeaning(e.target.value)}
          placeholder="English meaning / note..."
          className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all"
        >
          Add to Notebook
        </button>
      </form>

      {/* Trouble List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leechList.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all flex items-start justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-serif font-black text-white">{item.chinese}</span>
                <span className="text-sm font-semibold text-amber-400 font-mono">{item.pinyin}</span>
                <button
                  onClick={() => playMandarinAudio(item.chinese, 0.85)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Play audio"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

              <p className="text-xs text-slate-300">{item.meaning}</p>

              <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px]">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {item.source}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                  {item.mistakeCount} missed
                </span>
                <span className="text-slate-500">Added {item.dateAdded}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => handleRemove(item.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                title="Remove from notebook"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {onSelectCharacterToWrite && (
                <button
                  type="button"
                  onClick={() => onSelectCharacterToWrite(item.chinese[0])}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-all text-[11px] flex items-center gap-1 font-medium"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Practice
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
