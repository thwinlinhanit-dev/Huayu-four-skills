export type SkillTab = 'writing' | 'listening' | 'speaking' | 'reading' | 'dashboard';

export interface StrokeInfo {
  step: number;
  type: string;
  name: string;
  pinyinName?: string;
  path?: string; // SVG path data if custom stroke
}

export interface CharacterData {
  id: string;
  character: string;
  pinyin: string;
  tone: 1 | 2 | 3 | 4 | 5;
  meaning: string;
  radical: string;
  radicalMeaning: string;
  strokeCount: number;
  hskLevel: number;
  etymology?: string;
  examples: { word: string; pinyin: string; meaning: string }[];
  strokeSequence: StrokeInfo[];
  svgStrokes?: string[]; // Array of SVG path commands for animated stroke tracing
}

export interface ToneQuestion {
  id: string;
  pinyinBase: string; // e.g., "ma", "tang", "shi"
  tone: 1 | 2 | 3 | 4;
  character: string;
  pinyin: string;
  meaning: string;
  distractors: {
    tone: 1 | 2 | 3 | 4;
    character: string;
    pinyin: string;
    meaning: string;
  }[];
}

export interface ListeningExercise {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  audioText: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SpeakingPhrase {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  tones: number[];
  category: 'Greetings' | 'Daily' | 'Travel' | 'Tongue Twister' | 'Idiom';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface ReadingStory {
  id: string;
  titleChinese: string;
  titlePinyin: string;
  titleEnglish: string;
  hskLevel: number;
  category: string;
  paragraphs: {
    chinese: string;
    pinyin: string;
    english: string;
    wordTokens: {
      char: string;
      pinyin: string;
      meaning: string;
      radical?: string;
    }[];
  }[];
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface RadicalInfo {
  radical: string;
  pinyin: string;
  meaning: string;
  strokeCount: number;
  examples: string[];
  description: string;
}

export interface YongPrinciple {
  id: number;
  traditionalName: string;
  strokeType: string;
  pinyin: string;
  name: string;
  metaphor: string;
  technique: string;
  strokeIndex: number;
}

export interface PinyinSound {
  symbol: string;
  ipa: string;
  exampleChar: string;
  examplePinyin: string;
  category: 'initial' | 'simpleFinal' | 'compoundFinal' | 'nasalFinal';
  audioPrompt: string;
}

export interface UserProgress {
  practicedCharacters: string[];
  toneQuizScore: { correct: number; total: number };
  speakingPracticed: string[];
  readingCompleted: string[];
  streakDays: number;
  lastPracticedDate: string;
}

export interface ChengyuItem {
  id: string;
  idiom: string;
  pinyin: string;
  literal: string;
  figurative: string;
  story: string;
  characters: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface TongueTwister {
  id: string;
  title: string;
  chinese: string;
  pinyin: string;
  english: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Master';
  focus: string;
}

export interface ToneSandhiRule {
  id: string;
  title: string;
  chineseRule: string;
  description: string;
  examples: {
    written: string;
    writtenPinyin: string;
    spokenPinyin: string;
    meaning: string;
    note: string;
  }[];
}

export interface MinimalPair {
  id: string;
  category: string;
  description: string;
  itemA: { char: string; pinyin: string; ipa: string; meaning: string };
  itemB: { char: string; pinyin: string; ipa: string; meaning: string };
}

export interface SrsFlashcard {
  id: string;
  character: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  interval: number; // in days
  repetition: number;
  easeFactor: number;
  dueDate: number; // timestamp
}
