export interface RadicalComponent {
  part: string;
  pinyin: string;
  meaning: string;
  role: 'semantic' | 'phonetic' | 'root';
}

export interface CognateItem {
  char: string;
  pinyin: string;
  meaning: string;
}

export interface RadicalDecomposition {
  character: string;
  pinyin: string;
  meaning: string;
  formation: 'Pictophonetic (形声)' | 'Ideographic (会意)' | 'Pictographic (象形)';
  structure: 'Left-Right (左右)' | 'Top-Bottom (上下)' | 'Surround (包围)' | 'Single (独体)';
  components: RadicalComponent[];
  mnemonic: string;
  cognates?: CognateItem[];
}

export const RADICAL_DECOMPOSITION_DATABASE: RadicalDecomposition[] = [
  {
    character: '语',
    pinyin: 'yǔ',
    meaning: 'Language / words / speech',
    formation: 'Pictophonetic (形声)',
    structure: 'Left-Right (左右)',
    components: [
      { part: '讠(言)', pinyin: 'yán', meaning: 'speech / words', role: 'semantic' },
      { part: '吾', pinyin: 'wú', meaning: 'I / myself', role: 'phonetic' },
    ],
    mnemonic: 'Words (讠) spoken from oneself (吾) form language and spoken words (语).',
    cognates: [
      { char: '话', pinyin: 'huà', meaning: 'words / talk' },
      { char: '说', pinyin: 'shuō', meaning: 'to speak' },
      { char: '读', pinyin: 'dú', meaning: 'to read' },
    ],
  },
  {
    character: '覆',
    pinyin: 'fù',
    meaning: 'To cover / overturn / capsize',
    formation: 'Ideographic (会意)',
    structure: 'Top-Bottom (上下)',
    components: [
      { part: '覀(襾)', pinyin: 'yà', meaning: 'cover / cap', role: 'semantic' },
      { part: '复', pinyin: 'fù', meaning: 'repeat / return', role: 'phonetic' },
    ],
    mnemonic: 'A cover or lid (覀) placed repeatedly (复) turns or flips completely over (覆). As in 覆水难收 (spilt water cannot be gathered).',
    cognates: [
      { char: '复', pinyin: 'fù', meaning: 'duplicate' },
      { char: '腹', pinyin: 'fù', meaning: 'abdomen' },
      { char: '馥', pinyin: 'fù', meaning: 'fragrance' },
    ],
  },
  {
    character: '清',
    pinyin: 'qīng',
    meaning: 'Clear / pure / fresh',
    formation: 'Pictophonetic (形声)',
    structure: 'Left-Right (左右)',
    components: [
      { part: '氵(水)', pinyin: 'shuǐ', meaning: 'water', role: 'semantic' },
      { part: '青', pinyin: 'qīng', meaning: 'cyan / verdant nature', role: 'phonetic' },
    ],
    mnemonic: 'Water (氵) as pure and untainted as fresh green-blue nature (青) is clear (清).',
    cognates: [
      { char: '晴', pinyin: 'qíng', meaning: 'sunny / clear sky' },
      { char: '情', pinyin: 'qíng', meaning: 'feeling / emotion' },
      { char: '请', pinyin: 'qǐng', meaning: 'please / invite' },
    ],
  },
  {
    character: '休',
    pinyin: 'xiū',
    meaning: 'To rest / pause / cease',
    formation: 'Ideographic (会意)',
    structure: 'Left-Right (左右)',
    components: [
      { part: '亻(人)', pinyin: 'rén', meaning: 'person', role: 'semantic' },
      { part: '木', pinyin: 'mù', meaning: 'tree / wood', role: 'semantic' },
    ],
    mnemonic: 'A person (亻) leaning peacefully against a shady tree (木) represents resting (休).',
    cognates: [
      { char: '体', pinyin: 'tǐ', meaning: 'body' },
      { char: '保', pinyin: 'bǎo', meaning: 'protect' },
    ],
  },
  {
    character: '明',
    pinyin: 'míng',
    meaning: 'Bright / clear / luminous',
    formation: 'Ideographic (会意)',
    structure: 'Left-Right (左右)',
    components: [
      { part: '日', pinyin: 'rì', meaning: 'sun', role: 'semantic' },
      { part: '月', pinyin: 'yuè', meaning: 'moon', role: 'semantic' },
    ],
    mnemonic: 'The two brightest heavenly bodies in the cosmos—the Sun (日) and the Moon (月)—standing together create ultimate brightness (明).',
    cognates: [
      { char: '晴', pinyin: 'qíng', meaning: 'sunny' },
      { char: '晨', pinyin: 'chén', meaning: 'morning' },
    ],
  },
  {
    character: '唱',
    pinyin: 'chàng',
    meaning: 'To sing / chant / vocalize',
    formation: 'Pictophonetic (形声)',
    structure: 'Left-Right (左右)',
    components: [
      { part: '口', pinyin: 'kǒu', meaning: 'mouth', role: 'semantic' },
      { part: '昌', pinyin: 'chāng', meaning: 'flourishing / bright', role: 'phonetic' },
    ],
    mnemonic: 'Using the mouth (口) with melodic resonance like the phonetic sound昌 (chāng) to sing songs (唱).',
    cognates: [
      { char: '鸣', pinyin: 'míng', meaning: 'birds chirping' },
      { char: '喝', pinyin: 'hē', meaning: 'to drink' },
    ],
  },
  {
    character: '想',
    pinyin: 'xiǎng',
    meaning: 'To think / miss / ponder',
    formation: 'Pictophonetic (形声)',
    structure: 'Top-Bottom (上下)',
    components: [
      { part: '相', pinyin: 'xiāng / xiàng', meaning: 'mutual / appearance', role: 'phonetic' },
      { part: '心', pinyin: 'xīn', meaning: 'heart / mind', role: 'semantic' },
    ],
    mnemonic: 'Holding an image or person (相) in your deep heart and mind (心) means thinking and yearning (想).',
    cognates: [
      { char: '念', pinyin: 'niàn', meaning: 'to miss' },
      { char: '意', pinyin: 'yì', meaning: 'intention' },
      { char: '感', pinyin: 'gǎn', meaning: 'feeling' },
    ],
  },
  {
    character: '笔',
    pinyin: 'bǐ',
    meaning: 'Writing brush / pen',
    formation: 'Ideographic (会意)',
    structure: 'Top-Bottom (上下)',
    components: [
      { part: '⺮(竹)', pinyin: 'zhú', meaning: 'bamboo', role: 'semantic' },
      { part: '毛', pinyin: 'máo', meaning: 'animal hair / fur', role: 'semantic' },
    ],
    mnemonic: 'Traditional Chinese calligraphy brushes consist of a bamboo shaft (竹) attached to animal hair bristles (毛).',
    cognates: [
      { char: '筷', pinyin: 'kuài', meaning: 'chopsticks' },
      { char: '答', pinyin: 'dá', meaning: 'answer' },
    ],
  },
];
