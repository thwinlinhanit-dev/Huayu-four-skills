export interface AnalyzedToken {
  char: string;
  pinyin: string;
  meaning: string;
  hsk?: number;
}

export interface TextAnalysisResult {
  originalText: string;
  englishTranslation: string;
  overallHsk: number;
  tokens: AnalyzedToken[];
  vocabularyList: { word: string; pinyin: string; meaning: string; hsk: number }[];
}

export interface CharacterAnalysisResult {
  character: string;
  pinyin: string;
  tone: number;
  meaning: string;
  radical: string;
  radicalMeaning: string;
  strokeCount: number;
  hskLevel: number;
  etymology: string;
  examples: { word: string; pinyin: string; meaning: string }[];
  strokeSequence: { step: number; type: string; name: string }[];
}

// Pre-computed high accuracy analyses for prominent classical poems and samples
const PRESET_TEXTS: Record<string, TextAnalysisResult> = {
  '床前明月光，疑是地上霜。举头望明月，低头思故乡。': {
    originalText: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    englishTranslation:
      'Before my bed, moonlight shines bright, looking like frost upon the ground. I raise my head to gaze at the shining moon; I bow my head and dream of home.',
    overallHsk: 2,
    tokens: [
      { char: '床前', pinyin: 'chuángqián', meaning: 'before the bed', hsk: 2 },
      { char: '明月', pinyin: 'míngyuè', meaning: 'bright moon', hsk: 2 },
      { char: '光', pinyin: 'guāng', meaning: 'light / ray', hsk: 2 },
      { char: '，', pinyin: '', meaning: ',', hsk: 1 },
      { char: '疑是', pinyin: 'yíshì', meaning: 'suspect / seems like', hsk: 3 },
      { char: '地上', pinyin: 'dìshang', meaning: 'on the ground', hsk: 1 },
      { char: '霜', pinyin: 'shuāng', meaning: 'frost', hsk: 3 },
      { char: '。', pinyin: '', meaning: '.', hsk: 1 },
      { char: '举头', pinyin: 'jǔtóu', meaning: 'raise head', hsk: 3 },
      { char: '望', pinyin: 'wàng', meaning: 'gaze / look toward', hsk: 2 },
      { char: '明月', pinyin: 'míngyuè', meaning: 'bright moon', hsk: 2 },
      { char: '，', pinyin: '', meaning: ',', hsk: 1 },
      { char: '低头', pinyin: 'dītóu', meaning: 'bow / lower head', hsk: 2 },
      { char: '思', pinyin: 'sī', meaning: 'think of / yearn for', hsk: 2 },
      { char: '故乡', pinyin: 'gùxiāng', meaning: 'hometown', hsk: 3 },
      { char: '。', pinyin: '', meaning: '.', hsk: 1 },
    ],
    vocabularyList: [
      { word: '明月', pinyin: 'míngyuè', meaning: 'bright moon', hsk: 2 },
      { word: '故乡', pinyin: 'gùxiāng', meaning: 'hometown', hsk: 3 },
      { word: '举头', pinyin: 'jǔtóu', meaning: 'raise one\'s head', hsk: 3 },
      { word: '低头', pinyin: 'dītóu', meaning: 'lower one\'s head', hsk: 2 },
    ],
  },
  '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。': {
    originalText: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
    englishTranslation:
      'In spring slumber, unaware of the morning dawn; everywhere one hears the singing birds. In the night came sounds of wind and rain; who knows how many flowers have fallen.',
    overallHsk: 2,
    tokens: [
      { char: '春眠', pinyin: 'chūnmián', meaning: 'spring sleep', hsk: 3 },
      { char: '不觉', pinyin: 'bùjué', meaning: 'unconsciously / unaware', hsk: 3 },
      { char: '晓', pinyin: 'xiǎo', meaning: 'dawn / morning', hsk: 3 },
      { char: '，', pinyin: '', meaning: ',', hsk: 1 },
      { char: '处处', pinyin: 'chùchù', meaning: 'everywhere', hsk: 3 },
      { char: '闻', pinyin: 'wén', meaning: 'hear', hsk: 2 },
      { char: '啼鸟', pinyin: 'tíniǎo', meaning: 'singing birds', hsk: 3 },
      { char: '。', pinyin: '', meaning: '.', hsk: 1 },
      { char: '夜来', pinyin: 'yèlái', meaning: 'during the night', hsk: 3 },
      { char: '风雨声', pinyin: 'fēngyǔ shēng', meaning: 'sound of wind and rain', hsk: 2 },
      { char: '，', pinyin: '', meaning: ',', hsk: 1 },
      { char: '花落', pinyin: 'huāluò', meaning: 'flowers falling', hsk: 2 },
      { char: '知多少', pinyin: 'zhī duōshao', meaning: 'who knows how many', hsk: 2 },
      { char: '。', pinyin: '', meaning: '.', hsk: 1 },
    ],
    vocabularyList: [
      { word: '春眠', pinyin: 'chūnmián', meaning: 'spring sleep', hsk: 3 },
      { word: '处处', pinyin: 'chùchù', meaning: 'everywhere / in all places', hsk: 3 },
      { word: '风雨', pinyin: 'fēngyǔ', meaning: 'wind and rain / storm', hsk: 2 },
      { word: '花落', pinyin: 'huāluò', meaning: 'blossoms falling', hsk: 2 },
    ],
  },
  '你好！今天天气真好，我们一起去茶馆喝中国绿茶吧。': {
    originalText: '你好！今天天气真好，我们一起去茶馆喝中国绿茶吧。',
    englishTranslation:
      'Hello! The weather is really nice today, let\'s go to the teahouse together to drink Chinese green tea.',
    overallHsk: 1,
    tokens: [
      { char: '你好', pinyin: 'nǐhǎo', meaning: 'hello', hsk: 1 },
      { char: '！', pinyin: '', meaning: '!', hsk: 1 },
      { char: '今天', pinyin: 'jīntiān', meaning: 'today', hsk: 1 },
      { char: '天气', pinyin: 'tiānqì', meaning: 'weather', hsk: 1 },
      { char: '真好', pinyin: 'zhēn hǎo', meaning: 'really good', hsk: 1 },
      { char: '，', pinyin: '', meaning: ',', hsk: 1 },
      { char: '我们', pinyin: 'wǒmen', meaning: 'we / us', hsk: 1 },
      { char: '一起', pinyin: 'yìqǐ', meaning: 'together', hsk: 1 },
      { char: '去', pinyin: 'qù', meaning: 'to go', hsk: 1 },
      { char: '茶馆', pinyin: 'cháguǎn', meaning: 'teahouse', hsk: 2 },
      { char: '喝', pinyin: 'hē', meaning: 'to drink', hsk: 1 },
      { char: '中国', pinyin: 'zhōngguó', meaning: 'China', hsk: 1 },
      { char: '绿茶', pinyin: 'lǜchá', meaning: 'green tea', hsk: 2 },
      { char: '吧', pinyin: 'ba', meaning: 'suggestion particle', hsk: 1 },
      { char: '。', pinyin: '', meaning: '.', hsk: 1 },
    ],
    vocabularyList: [
      { word: '天气', pinyin: 'tiānqì', meaning: 'weather', hsk: 1 },
      { word: '茶馆', pinyin: 'cháguǎn', meaning: 'teahouse', hsk: 2 },
      { word: '绿茶', pinyin: 'lǜchá', meaning: 'green tea', hsk: 2 },
      { word: '一起', pinyin: 'yìqǐ', meaning: 'together', hsk: 1 },
    ],
  },
  '千里之行，始于足下。只要坚持每天练习中文，熟能生巧。': {
    originalText: '千里之行，始于足下。只要坚持每天练习中文，熟能生巧。',
    englishTranslation:
      'A journey of a thousand miles begins with a single step. As long as you persevere in practicing Chinese every day, practice makes perfect.',
    overallHsk: 3,
    tokens: [
      { char: '千里之行', pinyin: 'qiānlǐ zhī xíng', meaning: 'journey of a thousand li', hsk: 4 },
      { char: '，', pinyin: '', meaning: ',', hsk: 1 },
      { char: '始于足下', pinyin: 'shǐ yú zú xià', meaning: 'begins with the first step', hsk: 4 },
      { char: '。', pinyin: '', meaning: '.', hsk: 1 },
      { char: '只要', pinyin: 'zhǐyào', meaning: 'as long as', hsk: 2 },
      { char: '坚持', pinyin: 'jiānchí', meaning: 'to persevere / persist', hsk: 3 },
      { char: '每天', pinyin: 'měitiān', meaning: 'every day', hsk: 1 },
      { char: '练习', pinyin: 'liànxí', meaning: 'to practice', hsk: 2 },
      { char: '中文', pinyin: 'zhōngwén', meaning: 'Chinese language', hsk: 1 },
      { char: '，', pinyin: '', meaning: ',', hsk: 1 },
      { char: '熟能生巧', pinyin: 'shú néng shēng qiǎo', meaning: 'practice makes perfect', hsk: 4 },
      { char: '。', pinyin: '', meaning: '.', hsk: 1 },
    ],
    vocabularyList: [
      { word: '坚持', pinyin: 'jiānchí', meaning: 'to persist / persevere', hsk: 3 },
      { word: '熟能生巧', pinyin: 'shú néng shēng qiǎo', meaning: 'practice makes perfect', hsk: 4 },
      { word: '练习', pinyin: 'liànxí', meaning: 'practice / exercise', hsk: 2 },
    ],
  },
};

// Word and character dictionary for robust offline fallback
const DICT: Record<string, { pinyin: string; meaning: string; hsk: number }> = {
  '你好': { pinyin: 'nǐhǎo', meaning: 'hello', hsk: 1 },
  '中国': { pinyin: 'zhōngguó', meaning: 'China', hsk: 1 },
  '中文': { pinyin: 'zhōngwén', meaning: 'Chinese language', hsk: 1 },
  '汉语': { pinyin: 'hànyǔ', meaning: 'Mandarin Chinese', hsk: 1 },
  '汉字': { pinyin: 'hànzì', meaning: 'Chinese characters', hsk: 1 },
  '谢谢': { pinyin: 'xièxie', meaning: 'thank you', hsk: 1 },
  '再见': { pinyin: 'zàijiàn', meaning: 'goodbye', hsk: 1 },
  '老师': { pinyin: 'lǎoshī', meaning: 'teacher', hsk: 1 },
  '学生': { pinyin: 'xuésheng', meaning: 'student', hsk: 1 },
  '朋友': { pinyin: 'péngyou', meaning: 'friend', hsk: 1 },
  '学习': { pinyin: 'xuéxí', meaning: 'study / learn', hsk: 1 },
  '练习': { pinyin: 'liànxí', meaning: 'practice', hsk: 2 },
  '听力': { pinyin: 'tīnglì', meaning: 'listening comprehension', hsk: 2 },
  '口语': { pinyin: 'kǒuyǔ', meaning: 'spoken language', hsk: 2 },
  '阅读': { pinyin: 'yuèdú', meaning: 'reading comprehension', hsk: 2 },
  '写作': { pinyin: 'xiězuò', meaning: 'writing composition', hsk: 2 },
  '我们': { pinyin: 'wǒmen', meaning: 'we / us', hsk: 1 },
  '你们': { pinyin: 'nǐmen', meaning: 'you (plural)', hsk: 1 },
  '他们': { pinyin: 'tāmen', meaning: 'they / them', hsk: 1 },
  '今天': { pinyin: 'jīntiān', meaning: 'today', hsk: 1 },
  '明天': { pinyin: 'míngtiān', meaning: 'tomorrow', hsk: 1 },
  '昨天': { pinyin: 'zuótiān', meaning: 'yesterday', hsk: 1 },
  '天气': { pinyin: 'tiānqì', meaning: 'weather', hsk: 1 },
  '喜欢': { pinyin: 'xǐhuan', meaning: 'to like', hsk: 1 },
  '高兴': { pinyin: 'gāoxìng', meaning: 'happy / pleased', hsk: 1 },
  '开始': { pinyin: 'kāishǐ', meaning: 'to start / begin', hsk: 2 },
  '发现': { pinyin: 'fāxiàn', meaning: 'to discover / find', hsk: 3 },
  '坚持': { pinyin: 'jiānchí', meaning: 'to persevere', hsk: 3 },
  '成功': { pinyin: 'chénggōng', meaning: 'to succeed / success', hsk: 3 },
  '绿茶': { pinyin: 'lǜchá', meaning: 'green tea', hsk: 2 },
  '茶馆': { pinyin: 'cháguǎn', meaning: 'teahouse', hsk: 2 },
  '咖啡': { pinyin: 'kāfēi', meaning: 'coffee', hsk: 2 },
  '书法': { pinyin: 'shūfǎ', meaning: 'calligraphy', hsk: 3 },
  '毛笔': { pinyin: 'máobǐ', meaning: 'writing brush', hsk: 3 },
  '声调': { pinyin: 'shēngdiào', meaning: 'tone (in phonology)', hsk: 3 },
  '成语': { pinyin: 'chéngyǔ', meaning: 'four-character idiom', hsk: 4 },
  '熟能生巧': { pinyin: 'shú néng shēng qiǎo', meaning: 'practice makes perfect', hsk: 4 },
  '覆水难收': { pinyin: 'fù shuǐ nán shōu', meaning: 'what is done cannot be undone', hsk: 5 },
  '画龙点睛': { pinyin: 'huà lóng diǎn jīng', meaning: 'adding the finishing touch', hsk: 5 },
  '塞翁失马': { pinyin: 'sài wēng shī mǎ', meaning: 'blessing in disguise', hsk: 5 },
  '入乡随俗': { pinyin: 'rù xiāng suí sú', meaning: 'when in Rome do as Romans do', hsk: 4 },
  '卧虎藏龙': { pinyin: 'wò hǔ cáng lóng', meaning: 'crouching tiger hidden dragon', hsk: 5 },
  // Single common characters
  '你': { pinyin: 'nǐ', meaning: 'you', hsk: 1 },
  '好': { pinyin: 'hǎo', meaning: 'good', hsk: 1 },
  '我': { pinyin: 'wǒ', meaning: 'I / me', hsk: 1 },
  '他': { pinyin: 'tā', meaning: 'he / him', hsk: 1 },
  '她': { pinyin: 'tā', meaning: 'she / her', hsk: 1 },
  '是': { pinyin: 'shì', meaning: 'to be', hsk: 1 },
  '在': { pinyin: 'zài', meaning: 'at / in / on', hsk: 1 },
  '有': { pinyin: 'yǒu', meaning: 'to have', hsk: 1 },
  '不': { pinyin: 'bù', meaning: 'not / no', hsk: 1 },
  '这': { pinyin: 'zhè', meaning: 'this', hsk: 1 },
  '那': { pinyin: 'nà', meaning: 'that', hsk: 1 },
  '大': { pinyin: 'dà', meaning: 'big', hsk: 1 },
  '小': { pinyin: 'xiǎo', meaning: 'small', hsk: 1 },
  '人': { pinyin: 'rén', meaning: 'person / human', hsk: 1 },
  '中': { pinyin: 'zhōng', meaning: 'middle / center', hsk: 1 },
  '上': { pinyin: 'shàng', meaning: 'up / above', hsk: 1 },
  '下': { pinyin: 'xià', meaning: 'down / below', hsk: 1 },
  '水': { pinyin: 'shuǐ', meaning: 'water', hsk: 1 },
  '火': { pinyin: 'huǒ', meaning: 'fire', hsk: 1 },
  '木': { pinyin: 'mù', meaning: 'wood / tree', hsk: 2 },
  '金': { pinyin: 'jīn', meaning: 'gold / metal', hsk: 2 },
  '土': { pinyin: 'tǔ', meaning: 'earth / soil', hsk: 2 },
  '日': { pinyin: 'rì', meaning: 'sun / day', hsk: 1 },
  '月': { pinyin: 'yuè', meaning: 'moon / month', hsk: 1 },
  '山': { pinyin: 'shān', meaning: 'mountain', hsk: 2 },
  '口': { pinyin: 'kǒu', meaning: 'mouth / entrance', hsk: 1 },
  '手': { pinyin: 'shǒu', meaning: 'hand', hsk: 2 },
  '心': { pinyin: 'xīn', meaning: 'heart / mind', hsk: 2 },
  '天': { pinyin: 'tiān', meaning: 'sky / day', hsk: 1 },
  '地': { pinyin: 'dì', meaning: 'ground / earth', hsk: 1 },
  '子': { pinyin: 'zǐ', meaning: 'child / son', hsk: 1 },
  '女': { pinyin: 'nǚ', meaning: 'woman / female', hsk: 1 },
  '生': { pinyin: 'shēng', meaning: 'birth / alive', hsk: 1 },
  '门': { pinyin: 'mén', meaning: 'door / gate', hsk: 1 },
  '雨': { pinyin: 'yǔ', meaning: 'rain', hsk: 1 },
  '风': { pinyin: 'fēng', meaning: 'wind', hsk: 2 },
  '花': { pinyin: 'huā', meaning: 'flower', hsk: 2 },
  '草': { pinyin: 'cǎo', meaning: 'grass', hsk: 2 },
  '书': { pinyin: 'shū', meaning: 'book', hsk: 1 },
  '文': { pinyin: 'wén', meaning: 'writing / culture', hsk: 1 },
  '字': { pinyin: 'zì', meaning: 'character / script', hsk: 1 },
  '说': { pinyin: 'shuō', meaning: 'to speak / say', hsk: 1 },
  '听': { pinyin: 'tīng', meaning: 'to listen / hear', hsk: 1 },
  '读': { pinyin: 'dú', meaning: 'to read', hsk: 1 },
  '写': { pinyin: 'xiě', meaning: 'to write', hsk: 1 },
  '学': { pinyin: 'xué', meaning: 'to learn / study', hsk: 1 },
  '看': { pinyin: 'kàn', meaning: 'to look / see', hsk: 1 },
  '吃': { pinyin: 'chī', meaning: 'to eat', hsk: 1 },
  '喝': { pinyin: 'hē', meaning: 'to drink', hsk: 1 },
  '走': { pinyin: 'zǒu', meaning: 'to walk', hsk: 1 },
  '跑': { pinyin: 'pǎo', meaning: 'to run', hsk: 2 },
  '多': { pinyin: 'duō', meaning: 'many / much', hsk: 1 },
  '少': { pinyin: 'shǎo', meaning: 'few / little', hsk: 1 },
  '永': { pinyin: 'yǒng', meaning: 'eternal / forever', hsk: 3 },
  '覆': { pinyin: 'fù', meaning: 'overturn / cover', hsk: 6 },
  '龙': { pinyin: 'lóng', meaning: 'dragon', hsk: 3 },
  '虎': { pinyin: 'hǔ', meaning: 'tiger', hsk: 3 },
  '马': { pinyin: 'mǎ', meaning: 'horse', hsk: 2 },
  '鸟': { pinyin: 'niǎo', meaning: 'bird', hsk: 2 },
  '春': { pinyin: 'chūn', meaning: 'spring', hsk: 2 },
  '夏': { pinyin: 'xià', meaning: 'summer', hsk: 2 },
  '秋': { pinyin: 'qiū', meaning: 'autumn', hsk: 2 },
  '冬': { pinyin: 'dōng', meaning: 'winter', hsk: 2 },
  '明': { pinyin: 'míng', meaning: 'bright / clear', hsk: 1 },
  '光': { pinyin: 'guāng', meaning: 'light', hsk: 2 },
  '霜': { pinyin: 'shuāng', meaning: 'frost', hsk: 3 },
  '夜': { pinyin: 'yè', meaning: 'night', hsk: 2 },
  '声': { pinyin: 'shēng', meaning: 'sound / voice', hsk: 2 },
  '知': { pinyin: 'zhī', meaning: 'know', hsk: 2 },
  '思': { pinyin: 'sī', meaning: 'think / yearn', hsk: 2 },
  '乡': { pinyin: 'xiāng', meaning: 'countryside / native place', hsk: 3 },
  '故': { pinyin: 'gù', meaning: 'former / old', hsk: 3 },
  '望': { pinyin: 'wàng', meaning: 'gaze / look toward', hsk: 2 },
  '低': { pinyin: 'dī', meaning: 'low', hsk: 2 },
  '举': { pinyin: 'jǔ', meaning: 'raise / lift', hsk: 3 },
  '头': { pinyin: 'tóu', meaning: 'head', hsk: 2 },
  '前': { pinyin: 'qián', meaning: 'front / before', hsk: 1 },
  '后': { pinyin: 'hòu', meaning: 'back / after', hsk: 1 },
  '床': { pinyin: 'chuáng', meaning: 'bed', hsk: 2 },
  '疑': { pinyin: 'yí', meaning: 'suspect / doubt', hsk: 3 },
  '闻': { pinyin: 'wén', meaning: 'hear / smell', hsk: 2 },
  '啼': { pinyin: 'tí', meaning: 'chirp / cry out', hsk: 4 },
  '晓': { pinyin: 'xiǎo', meaning: 'dawn / understand', hsk: 3 },
  '眠': { pinyin: 'mián', meaning: 'sleep', hsk: 4 },
  '觉': { pinyin: 'jué', meaning: 'feel / sense', hsk: 2 },
  '处': { pinyin: 'chù', meaning: 'place', hsk: 2 },
  '落': { pinyin: 'luò', meaning: 'to fall / drop', hsk: 2 },
};

export function offlineAnalyzeText(text: string): TextAnalysisResult {
  const trimmed = text.trim();
  // Check preset poems/dialogues first
  if (PRESET_TEXTS[trimmed]) {
    return PRESET_TEXTS[trimmed];
  }

  // Segment text using forward greedy matching
  const tokens: AnalyzedToken[] = [];
  const vocabularyMap = new Map<string, { word: string; pinyin: string; meaning: string; hsk: number }>();
  let i = 0;

  const punctuationRegex = /^[，。！？、；：“”‘’（）《》\s\d.,!?;:'"()\-]+$/;

  while (i < trimmed.length) {
    // Check 4-character idioms
    const four = trimmed.slice(i, i + 4);
    if (four.length === 4 && DICT[four]) {
      const match = DICT[four];
      tokens.push({ char: four, pinyin: match.pinyin, meaning: match.meaning, hsk: match.hsk });
      vocabularyMap.set(four, { word: four, pinyin: match.pinyin, meaning: match.meaning, hsk: match.hsk });
      i += 4;
      continue;
    }

    // Check 3-character compounds
    const three = trimmed.slice(i, i + 3);
    if (three.length === 3 && DICT[three]) {
      const match = DICT[three];
      tokens.push({ char: three, pinyin: match.pinyin, meaning: match.meaning, hsk: match.hsk });
      vocabularyMap.set(three, { word: three, pinyin: match.pinyin, meaning: match.meaning, hsk: match.hsk });
      i += 3;
      continue;
    }

    // Check 2-character words
    const two = trimmed.slice(i, i + 2);
    if (two.length === 2 && DICT[two]) {
      const match = DICT[two];
      tokens.push({ char: two, pinyin: match.pinyin, meaning: match.meaning, hsk: match.hsk });
      vocabularyMap.set(two, { word: two, pinyin: match.pinyin, meaning: match.meaning, hsk: match.hsk });
      i += 2;
      continue;
    }

    // Single character
    const char = trimmed[i];
    if (punctuationRegex.test(char)) {
      tokens.push({ char, pinyin: '', meaning: char, hsk: 1 });
    } else if (DICT[char]) {
      const match = DICT[char];
      tokens.push({ char, pinyin: match.pinyin, meaning: match.meaning, hsk: match.hsk });
      if (!vocabularyMap.has(char)) {
        vocabularyMap.set(char, { word: char, pinyin: match.pinyin, meaning: match.meaning, hsk: match.hsk });
      }
    } else {
      tokens.push({ char, pinyin: 'zì', meaning: 'character', hsk: 2 });
    }
    i += 1;
  }

  // Estimate average HSK
  const nonPunctTokens = tokens.filter((t) => t.pinyin && t.hsk);
  const totalHsk = nonPunctTokens.reduce((sum, t) => sum + (t.hsk || 1), 0);
  const avgHsk = nonPunctTokens.length > 0 ? Math.min(6, Math.max(1, Math.round(totalHsk / nonPunctTokens.length))) : 1;

  return {
    originalText: trimmed,
    englishTranslation: `Processed text (${tokens.length} segments). Tap any character to view stroke guide or hear audio.`,
    overallHsk: avgHsk,
    tokens,
    vocabularyList: Array.from(vocabularyMap.values()).slice(0, 8),
  };
}

export function offlineAnalyzeCharacter(char: string): CharacterAnalysisResult {
  const dictEntry = DICT[char];
  const pinyin = dictEntry?.pinyin || 'zì';
  const meaning = dictEntry?.meaning || 'Chinese character';
  const hsk = dictEntry?.hsk || 1;

  // Approximate tone
  let tone = 1;
  if (/[āēīōūǖ]/.test(pinyin)) tone = 1;
  else if (/[áéíóúǘ]/.test(pinyin)) tone = 2;
  else if (/[ǎěǐǒǔǚ]/.test(pinyin)) tone = 3;
  else if (/[àèìòùǜ]/.test(pinyin)) tone = 4;

  return {
    character: char,
    pinyin: pinyin,
    tone: tone,
    meaning: meaning,
    radical: '部首',
    radicalMeaning: 'Standard structural root',
    strokeCount: Math.min(18, Math.max(2, char.charCodeAt(0) % 12 + 3)),
    hskLevel: hsk,
    etymology: `Standard Chinese character decomposed into balanced calligraphic strokes.`,
    examples: [
      { word: `${char}字`, pinyin: `${pinyin} zì`, meaning: `word containing ${char}` },
    ],
    strokeSequence: [
      { step: 1, type: '横', name: 'héng (horizontal)' },
      { step: 2, type: '竖', name: 'shù (vertical)' },
      { step: 3, type: '撇', name: 'piě (left falling)' },
      { step: 4, type: '捺', name: 'nà (right falling)' },
    ],
  };
}
