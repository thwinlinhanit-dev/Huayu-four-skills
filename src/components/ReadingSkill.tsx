import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  PenTool,
  RotateCw,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  BookmarkPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReadingStory } from '../types';
import { playMandarinAudio } from '../utils/audio';
import { READING_STORIES, CHARACTERS_DATABASE } from '../data/chineseData';
import { recordStoryCompletion } from '../utils/progressStore';
import { addCards, loadDeck, removeCard } from '../utils/srs';
import { pushToast } from './ToastHost';
import { TextPinyinizer } from './TextPinyinizer';
import { SrsFlashcards } from './SrsFlashcards';
import { TroubleListNotebook } from './TroubleListNotebook';
import { CustomLessonCreator } from './CustomLessonCreator';
import { ModernDropdown } from './ModernDropdown';
import { GrammarUnscrambler } from './GrammarUnscrambler';

interface ReadingSkillProps {
  onSelectCharacterToWrite?: (char: string) => void;
  onCharacterMastered?: (char: string) => void;
}

export const ReadingSkill: React.FC<ReadingSkillProps> = ({ onSelectCharacterToWrite, onCharacterMastered }) => {
  const [subTab, setSubTab] = useState<'stories' | 'grammarUnscrambler' | 'pinyinizer' | 'creator' | 'troubleList' | 'srsFlashcards' | 'flashcards'>('stories');
  const [hskFilter, setHskFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5 | 6>('all');
  const [customStories, setCustomStories] = useState<ReadingStory[]>(() => {
    try {
      const saved = localStorage.getItem('huayu_custom_stories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number>(0);
  const [pinyinMode, setPinyinMode] = useState<'always' | 'hover' | 'hidden'>('always');
  const [showEnglish, setShowEnglish] = useState<boolean>(false);
  const [activeWordToken, setActiveWordToken] = useState<any | null>(null);

  const allStories: ReadingStory[] = [...customStories, ...READING_STORIES];

  const handleSaveCustomStory = (story: ReadingStory) => {
    const updated = [story, ...customStories];
    setCustomStories(updated);
    try {
      localStorage.setItem('huayu_custom_stories', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setSelectedStoryIndex(0);
    setSubTab('stories');
  };

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const currentStory: ReadingStory = allStories[selectedStoryIndex % allStories.length] || allStories[0];
  const currentCard = CHARACTERS_DATABASE[flashcardIndex % CHARACTERS_DATABASE.length];

  const handlePlayStoryParagraph = (text: string) => {
    playMandarinAudio(text, 0.85);
  };

  const handleSelectQuizOption = (qIdx: number, optIdx: number) => {
    if (isQuizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleCheckQuiz = () => {
    setIsQuizSubmitted(true);
    let allCorrect = true;
    currentStory.questions.forEach((q, idx) => {
      if (quizAnswers[idx] !== q.correctIndex) {
        allCorrect = false;
      }
    });

    if (allCorrect) {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    }
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setIsQuizSubmitted(false);
  };

  const handleCardNext = () => {
    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev + 1) % CHARACTERS_DATABASE.length);
  };

  const handleCardPrev = () => {
    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev - 1 + CHARACTERS_DATABASE.length) % CHARACTERS_DATABASE.length);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Reading Skill · 阅读理解
            </h2>
            <p className="text-xs text-slate-400">Interactive graded passages with clickable dictionary & flashcards</p>
          </div>
        </div>

        {/* Reading Mode Dropdown Selector */}
        <div className="flex items-center">
          <ModernDropdown<'stories' | 'grammarUnscrambler' | 'pinyinizer' | 'creator' | 'troubleList' | 'srsFlashcards' | 'flashcards'>
            value={subTab}
            onChange={setSubTab}
            accentColor="emerald"
            options={[
              {
                id: 'stories',
                label: 'Graded Stories',
                chinese: '分级阅读',
                sublabel: 'HSK 1-5 stories with clickable tokens & audio narrator',
                icon: BookOpen,
              },
              {
                id: 'grammarUnscrambler',
                label: 'Grammar Unscrambler',
                chinese: '语序排列',
                sublabel: 'Time-manner-place syntax & disposal grammar tile drills',
                icon: Sparkles,
              },
              {
                id: 'pinyinizer',
                label: 'Smart Pinyinizer',
                chinese: '智能注音',
                sublabel: 'Paste any Chinese text to generate ruby Pinyin & vocab',
                icon: Sparkles,
              },
              {
                id: 'creator',
                label: 'Create Custom Lesson',
                chinese: '制作课程',
                sublabel: 'Author new lessons with automated AI segmentation & quiz builder',
                icon: PenTool,
              },
              {
                id: 'troubleList',
                label: 'Trouble List & Anki',
                chinese: '错题本',
                sublabel: 'High-frequency mistake words with Anki export & mastery tests',
                icon: Layers,
              },
              {
                id: 'srsFlashcards',
                label: 'SRS Memory Hub',
                chinese: '间隔复习',
                sublabel: 'SuperMemo-2 spaced repetition for optimal long-term retention',
                icon: RotateCw,
              },
              {
                id: 'flashcards',
                label: 'Vocab Flashcards',
                chinese: '生词卡',
                sublabel: 'Interactive flipping cards with stroke count & example phrases',
                icon: Layers,
              },
            ]}
          />
        </div>
      </div>

      {/* SUB-TAB 1: GRADED STORIES */}
      {subTab === 'stories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Story Reader Pane */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Story Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    HSK {currentStory.hskLevel}
                  </span>
                  <span className="text-xs text-slate-400">{currentStory.category}</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-slate-100">{currentStory.titleChinese}</h3>
                <p className="text-xs text-emerald-400 font-mono">{currentStory.titlePinyin}</p>
                <p className="text-xs text-slate-400 italic">{currentStory.titleEnglish}</p>
              </div>

              {/* 3-Stage Pinyin Fading & English Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 3-Stage Pinyin Control */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setPinyinMode('always')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      pinyinMode === 'always'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Always show Pinyin above Hanzi"
                  >
                    Pinyin Full
                  </button>
                  <button
                    onClick={() => setPinyinMode('hover')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      pinyinMode === 'hover'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Pedagogical Fading: Hover/Tap on word to reveal Pinyin"
                  >
                    Hover Peek
                  </button>
                  <button
                    onClick={() => setPinyinMode('hidden')}
                    className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      pinyinMode === 'hidden'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Pure Hanzi immersion without Pinyin"
                  >
                    Hanzi Only
                  </button>
                </div>

                <button
                  onClick={() => setShowEnglish(!showEnglish)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    showEnglish
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {showEnglish ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showEnglish ? 'English ON' : 'English OFF'}</span>
                </button>
              </div>
            </div>

            {/* Paragraphs with interactive word tokens */}
            <div className="space-y-6">
              {currentStory.paragraphs.map((para, pIdx) => (
                <div key={pIdx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Paragraph {pIdx + 1}</span>
                    <button
                      onClick={() => handlePlayStoryParagraph(para.chinese)}
                      className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs flex items-center gap-1"
                      title="Read paragraph aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Audio</span>
                    </button>
                  </div>

                  {/* Interactive Word Tokens with 3-stage Pinyin fading */}
                  <div className="flex flex-wrap items-baseline gap-1 leading-loose">
                    {para.wordTokens.map((token, tIdx) => (
                      <button
                        key={tIdx}
                        onClick={() => setActiveWordToken(token)}
                        className="inline-flex flex-col items-center px-1.5 py-0.5 rounded hover:bg-emerald-500/20 transition-all cursor-pointer group relative"
                      >
                        {pinyinMode === 'always' && (
                          <span className="text-[10px] text-emerald-400 font-mono group-hover:text-emerald-300">
                            {token.pinyin}
                          </span>
                        )}
                        {pinyinMode === 'hover' && (
                          <span className="text-[10px] text-emerald-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            {token.pinyin}
                          </span>
                        )}
                        {pinyinMode === 'hidden' && (
                          <span className="text-[10px] h-3 text-transparent select-none">
                            -
                          </span>
                        )}
                        <span className="font-serif text-lg sm:text-xl font-medium text-slate-200 group-hover:text-emerald-400">
                          {token.char}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* English sentence toggle */}
                  {showEnglish && (
                    <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-800/60 leading-relaxed">
                      {para.english}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Comprehension Questions */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200">Comprehension Check (阅读自测)</h4>
                {isQuizSubmitted && (
                  <button
                    onClick={handleResetQuiz}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {currentStory.questions.map((q, qIdx) => {
                  const userAns = quizAnswers[qIdx];
                  const isCorrect = userAns === q.correctIndex;
                  return (
                    <div key={qIdx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <p className="text-xs sm:text-sm font-semibold text-slate-200">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAns === optIdx;
                          let optStyle = 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300';

                          if (isQuizSubmitted) {
                            if (optIdx === q.correctIndex) {
                              optStyle = 'bg-emerald-950/40 border-emerald-400 text-emerald-300 font-bold';
                            } else if (isSelected && !isCorrect) {
                              optStyle = 'bg-rose-950/40 border-rose-400 text-rose-300';
                            } else {
                              optStyle = 'bg-slate-900/40 border-slate-800/30 opacity-40';
                            }
                          } else if (isSelected) {
                            optStyle = 'bg-emerald-950/30 border-emerald-500 text-emerald-300';
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectQuizOption(qIdx, optIdx)}
                              disabled={isQuizSubmitted}
                              className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${optStyle}`}
                            >
                              <span>{opt}</span>
                              {isQuizSubmitted && optIdx === q.correctIndex && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                              {isQuizSubmitted && isSelected && !isCorrect && (
                                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {isQuizSubmitted && (
                        <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                          <strong>Note:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isQuizSubmitted && (
                <button
                  onClick={handleCheckQuiz}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
                >
                  Submit Answers
                </button>
              )}
            </div>
          </div>

          {/* Right Sidebar: Story Selector & Clicked Word Inspector */}
          <div className="lg:col-span-4 space-y-5">
            {/* Clicked Word Dictionary Card */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Word Inspector (点击字词查看)
              </h4>

              {activeWordToken ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-3xl font-black text-emerald-400">
                      {activeWordToken.char}
                    </span>
                    <button
                      onClick={() => playMandarinAudio(activeWordToken.char)}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-sm font-bold text-slate-200 font-mono">{activeWordToken.pinyin}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{activeWordToken.meaning}</p>
                  </div>

                  {/* Button to practice writing this character! */}
                  {onSelectCharacterToWrite && (
                    <button
                      onClick={() => onSelectCharacterToWrite(activeWordToken.char[0])}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition-all"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Practice Writing "{activeWordToken.char[0]}" in Canvas →</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/60 text-center py-8">
                  <p className="text-xs text-slate-500">
                    Click any character or word in the reading passage to view pinyin, definition, and practice its strokes.
                  </p>
                </div>
              )}
            </div>

            {/* Story Picker list */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Select Story (选择短文)
                </h4>
              </div>

              {/* HSK Level Filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {(['all', 1, 2, 3, 4, 5, 6] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setHskFilter(lvl as any)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      hskFilter === lvl
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl === 'all' ? 'All HSK' : `HSK ${lvl}`}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {allStories.filter((st) => hskFilter === 'all' || st.hskLevel === hskFilter).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      const realIndex = allStories.findIndex((s) => s.id === st.id);
                      setSelectedStoryIndex(realIndex >= 0 ? realIndex : 0);
                      setIsQuizSubmitted(false);
                      setQuizAnswers({});
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      currentStory.id === st.id
                        ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-emerald-400 font-semibold">HSK {st.hskLevel}</span>
                      <span className="text-[10px] text-slate-500">{st.category}</span>
                    </div>
                    <p className="font-serif font-bold text-sm text-slate-100">{st.titleChinese}</p>
                    <p className="text-[11px] text-slate-400 italic truncate">{st.titleEnglish}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FLASHCARDS */}
      {subTab === 'flashcards' && (
        <div className="max-w-lg mx-auto bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
            <span className="text-xs font-mono text-slate-400">
              CARD {flashcardIndex + 1} OF {CHARACTERS_DATABASE.length}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              HSK {currentCard.hskLevel}
            </span>
          </div>

          {/* Interactive Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-80 bg-slate-950 border-2 border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer shadow-2xl transition-all select-none relative group"
          >
            <span className="absolute top-3 right-3 text-[10px] text-slate-500 group-hover:text-emerald-400 flex items-center gap-1">
              <RotateCw className="w-3 h-3" />
              <span>Tap to Flip</span>
            </span>

            {!isFlipped ? (
              // Front side: Large Hanzi
              <div className="flex flex-col items-center text-center">
                <span className="font-serif text-8xl font-black text-slate-100 group-hover:scale-105 transition-transform">
                  {currentCard.character}
                </span>
                <span className="text-xs text-slate-500 mt-4">Radical: {currentCard.radical} ({currentCard.radicalMeaning})</span>
              </div>
            ) : (
              // Back side: Pinyin, English, Examples, Audio
              <div className="flex flex-col items-center text-center space-y-3">
                <span className="text-3xl font-bold text-emerald-400 font-serif">{currentCard.character}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-sky-400 font-mono">{currentCard.pinyin}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playMandarinAudio(currentCard.character);
                    }}
                    className="p-1.5 rounded bg-slate-900 text-sky-400 hover:text-white"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-200 font-medium">{currentCard.meaning}</p>
                <p className="text-xs text-slate-400">{currentCard.strokeCount} strokes</p>

                {currentCard.examples && currentCard.examples.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">{currentCard.examples[0].word}</span> ({currentCard.examples[0].pinyin}) - {currentCard.examples[0].meaning}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="w-full flex items-center justify-between mt-6">
            <button
              onClick={handleCardPrev}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => playMandarinAudio(currentCard.character)}
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sky-400"
              title="Play pronunciation"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            <button
              onClick={handleCardNext}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB: GRAMMAR UNSCRAMBLER */}
      {subTab === 'grammarUnscrambler' && <GrammarUnscrambler />}

      {/* SUB-TAB: SMART PINYINIZER & CUSTOM TEXT ANALYZER */}
      {subTab === 'pinyinizer' && (
        <TextPinyinizer onSelectCharacterToWrite={onSelectCharacterToWrite} />
      )}

      {/* SUB-TAB: CUSTOM LESSON & STORY CREATOR */}
      {subTab === 'creator' && (
        <CustomLessonCreator
          onSaveStory={handleSaveCustomStory}
          onSelectCharacterToWrite={onSelectCharacterToWrite}
        />
      )}

      {/* SUB-TAB: TROUBLE LIST & ANKI NOTEBOOK */}
      {subTab === 'troubleList' && (
        <TroubleListNotebook onSelectCharacterToWrite={onSelectCharacterToWrite} />
      )}

      {/* SUB-TAB: SRS MEMORY FLASHCARDS HUB */}
      {subTab === 'srsFlashcards' && (
        <SrsFlashcards
        onSelectCharacterToWrite={onSelectCharacterToWrite}
        onMasteredChange={onCharacterMastered}
      />
      )}
    </div>
  );
};
