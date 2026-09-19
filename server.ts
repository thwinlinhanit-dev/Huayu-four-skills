import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { offlineAnalyzeText, offlineAnalyzeCharacter } from './src/server/offlineChineseAnalyzer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Fallback models when primary model experiences high demand (503 / 429)
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

async function callGeminiWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    systemInstruction?: string;
    responseMimeType?: string;
    temperature?: number;
  }
): Promise<string> {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: params.responseMimeType,
            temperature: params.temperature ?? 0.3,
          },
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const isUnavailable =
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('resource exhausted');

        if (isUnavailable && attempt === 0) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        // Move to the next model candidate
        break;
      }
    }
  }
  throw lastError || new Error('All candidate models failed');
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Chinese Speaking Tutor / Conversation Endpoint
  app.post('/api/conversation/chat', async (req, res) => {
    try {
      const { message, scenario, history = [] } = req.body;
      const ai = getGeminiClient();

      let parsed: any = null;

      if (ai) {
        const systemPrompt = `You are a supportive, friendly Mandarin Chinese language tutor assisting a student in practicing Chinese four skills (listening, speaking, reading, writing).
Scenario context: "${scenario || 'Daily Life & Free Conversation'}".
Target language: Standard Mandarin (Simplified Chinese).
Reply strictly with a valid JSON object:
{
  "replyChinese": "Chinese response text (natural, appropriate for learner)",
  "replyPinyin": "Pinyin with correct tone marks for each word",
  "replyEnglish": "English translation",
  "grammarTip": "A concise, helpful tip about a grammatical structure, tone rule, or vocabulary point used here",
  "suggestedReplies": [
    { "chinese": "...", "pinyin": "...", "english": "..." },
    { "chinese": "...", "pinyin": "...", "english": "..." }
  ]
}
Do not enclose in markdown code fences unless standard json. Keep JSON clean.`;

        const contents = [
          ...history.slice(-6).map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          })),
          {
            role: 'user',
            parts: [{ text: `Student says: "${message}". Please respond in character according to the scenario.` }],
          },
        ];

        try {
          const rawText = await callGeminiWithFallback(ai, {
            contents,
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.7,
          });
          parsed = JSON.parse(rawText || '{}');
        } catch (genErr: any) {
          console.warn('Gemini chat unavailable, using friendly fallback reply:', genErr?.message);
        }
      }

      if (!parsed || !parsed.replyChinese) {
        parsed = {
          replyChinese: `你好！我听到了你说的内容。我们继续练习吧！`,
          replyPinyin: 'Nǐ hǎo! Wǒ tīngdào le nǐ shuō de nèiróng. Wǒmen jìxù liànxí ba!',
          replyEnglish: 'Hello! I heard what you said. Let us continue practicing!',
          grammarTip: '练习 (liànxí) means to practice, and 吧 (ba) indicates a friendly suggestion.',
          suggestedReplies: [
            { chinese: '今天天气真好。', pinyin: 'Jīntiān tiānqì zhēn hǎo.', english: 'The weather is great today.' },
            { chinese: '我想练习点餐。', pinyin: 'Wǒ xiǎng liànxí diǎncān.', english: 'I want to practice ordering food.' },
          ],
        };
      }

      res.json(parsed);
    } catch (error: any) {
      console.error('Conversation endpoint error:', error);
      res.json({
        replyChinese: '很高兴和你练习中文！',
        replyPinyin: 'Hěn gāoxìng hé nǐ liànxí zhōngwén!',
        replyEnglish: 'Very happy to practice Chinese with you!',
        grammarTip: '高兴 (gāoxìng) means happy.',
        suggestedReplies: [],
      });
    }
  });

  // Streaming AI tutor chat (Server-Sent Events). The tutor reply streams token-by-token
  // so the UI can render it progressively; pinyin + tip + suggestions arrive as a final
  // metadata event. Falls back to a single "done" frame with the offline reply.
  app.post('/api/conversation/chat/stream', async (req, res) => {
    try {
      const { message, scenario, history = [] } = req.body;
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });
      const send = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      const ai = getGeminiClient();
      let streamed = false;

      if (ai) {
        const systemPrompt = `You are a supportive, friendly Mandarin Chinese language tutor assisting a student in practicing Chinese four skills (listening, speaking, reading, writing).
Scenario context: "${scenario || 'Daily Life & Free Conversation'}".
Target language: Standard Mandarin (Simplified Chinese).
Reply with a valid JSON object (no markdown fences):
{
  "replyChinese": "Chinese response text (natural, appropriate for learner)",
  "replyPinyin": "Pinyin with correct tone marks for each word",
  "replyEnglish": "English translation",
  "grammarTip": "A concise tip about a structure/tone/vocabulary point used here",
  "suggestedReplies": [
    { "chinese": "...", "pinyin": "...", "english": "..." },
    { "chinese": "...", "pinyin": "...", "english": "..." }
  ]
}
Stream the JSON as you generate it; keep it clean JSON.`;

        const contents = [
          ...history.slice(-6).map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          })),
          {
            role: 'user',
            parts: [{ text: `Student says: "${message}". Please respond in character according to the scenario.` }],
          },
        ];

        try {
          for (const modelName of CANDIDATE_MODELS) {
            try {
              const result = await ai.models.generateContentStream({
                model: modelName,
                contents,
                config: {
                  systemInstruction: systemPrompt,
                  responseMimeType: 'application/json',
                  temperature: 0.7,
                },
              });
              for await (const chunk of result) {
                const t = chunk?.text ?? '';
                if (t) {
                  streamed = true;
                  send('delta', { text: t });
                }
              }
              if (streamed) break;
            } catch (mErr: any) {
              console.warn(`stream model ${modelName} failed:`, mErr?.message);
            }
          }
        } catch (genErr: any) {
          console.warn('Gemini stream unavailable, using fallback:', genErr?.message);
        }
      }

      if (!streamed) {
        // Offline fallback: emit the friendly static reply as one delta frame
        send('delta', { text: JSON.stringify({
          replyChinese: `你好！我听到了你说的内容。我们继续练习吧！`,
          replyPinyin: 'Nǐ hǎo! Wǒ tīngdào le nǐ shuō de nèiróng. Wǒmen jìxù liànxí ba!',
          replyEnglish: 'Hello! I heard what you said. Let us continue practicing!',
          grammarTip: '练习 (liànxí) means to practice, and 吧 (ba) indicates a friendly suggestion.',
          suggestedReplies: [
            { chinese: '今天天气真好。', pinyin: 'Jīntiān tiānqì zhēn hǎo.', english: 'The weather is great today.' },
            { chinese: '我想练习点餐。', pinyin: 'Wǒ xiǎng liànxí diǎncān.', english: 'I want to practice ordering food.' },
          ],
        }) });
      }

      send('done', { ok: true });
      res.end();
    } catch (error: any) {
      console.error('Stream conversation endpoint error:', error);
      try {
        res.write(`event: done\ndata: ${JSON.stringify({ ok: false })}\n\n`);
        res.end();
      } catch {
        /* response already closed */
      }
    }
  });

  // AI Pronunciation & Speaking Assessment Endpoint
  app.post('/api/speech/feedback', async (req, res) => {
    try {
      const { targetText, targetPinyin, spokenText } = req.body;
      const ai = getGeminiClient();

      let parsed: any = null;

      if (ai) {
        const prompt = `Evaluate a Chinese learner's spoken attempt.
Target Chinese: "${targetText}" (${targetPinyin})
What speech recognition recognized: "${spokenText}"

Return JSON:
{
  "accuracyScore": number between 0 and 100,
  "feedback": "constructive 1-2 sentence feedback on pronunciation/tone",
  "toneAdvice": "specific tip for pronouncing the tones in '${targetText}' correctly",
  "matchedWords": ["word1", "word2"]
}`;

        try {
          const rawText = await callGeminiWithFallback(ai, {
            contents: prompt,
            responseMimeType: 'application/json',
            temperature: 0.3,
          });
          parsed = JSON.parse(rawText || '{}');
        } catch (genErr: any) {
          console.warn('Gemini speech feedback unavailable, computing heuristic score:', genErr?.message);
        }
      }

      if (!parsed || typeof parsed.accuracyScore !== 'number') {
        const isMatch = (targetText || '').trim() === (spokenText || '').trim();
        parsed = {
          accuracyScore: isMatch ? 98 : 80,
          feedback: isMatch
            ? 'Great pronunciation! Your tone and articulation matched the target character closely.'
            : `Recognized: "${spokenText || ''}". Focus on holding tone pitches steady and vowels clear.`,
          toneAdvice: 'Remember: 1st tone is high & flat, 2nd tone rises, 3rd tone dips, 4th tone falls sharply.',
        };
      }

      res.json(parsed);
    } catch (error: any) {
      console.error('Speech feedback error:', error);
      res.json({
        accuracyScore: 80,
        feedback: 'Good attempt! Keep practicing your tones and mouth shape.',
        toneAdvice: 'Focus on clear tone contours.',
      });
    }
  });

  // Custom Character Deep Analyzer (Breakdown, Radical, Meaning, Stroke Count, Etymology)
  app.post('/api/character/analyze', async (req, res) => {
    try {
      const { character } = req.body;
      if (!character) {
        return res.status(400).json({ error: 'Character is required' });
      }

      const ai = getGeminiClient();
      let parsed: any = null;

      if (ai) {
        const prompt = `Analyze the Chinese character: "${character}".
Provide detailed linguistic and stroke breakdown strictly in JSON format:
{
  "character": "${character}",
  "pinyin": "pīnyīn with tone mark (e.g. fù)",
  "tone": 1 | 2 | 3 | 4 | 5,
  "meaning": "primary English meaning",
  "radical": "radical character (e.g. 西 or 氵)",
  "radicalMeaning": "English meaning of radical",
  "strokeCount": number,
  "hskLevel": 1 | 2 | 3 | 4 | 5 | 6,
  "etymology": "short explanation of character structure / origin / mnemonic",
  "examples": [
    { "word": "Chinese word", "pinyin": "pinyin", "meaning": "English meaning" }
  ],
  "strokeSequence": [
    { "step": 1, "type": "横", "name": "héng (horizontal)" }
  ]
}`;

        try {
          const rawText = await callGeminiWithFallback(ai, {
            contents: prompt,
            responseMimeType: 'application/json',
            temperature: 0.2,
          });
          parsed = JSON.parse(rawText || '{}');
        } catch (genErr: any) {
          console.warn('Gemini character analysis unavailable, using offline analyzer:', genErr?.message);
        }
      }

      if (!parsed || !parsed.pinyin) {
        parsed = offlineAnalyzeCharacter(character);
      }

      res.json(parsed);
    } catch (error: any) {
      console.error('Character analysis endpoint error:', error);
      res.json(offlineAnalyzeCharacter(req.body?.character || '字'));
    }
  });

  // Custom Text Pinyinizer, HSK Analyzer & Word Segmenter
  app.post('/api/text/analyze', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required' });
      }

      const ai = getGeminiClient();
      let parsed: any = null;

      if (ai) {
        const prompt = `Analyze and segment this Chinese text for language learners:
"${text.slice(0, 1000)}"

Return strictly valid JSON:
{
  "originalText": "${text.slice(0, 1000).replace(/"/g, '\\"')}",
  "englishTranslation": "Fluid, accurate English translation of the entire passage",
  "overallHsk": number (1 to 6 indicating estimated average HSK level),
  "tokens": [
    {
      "char": "word or character token (e.g. 我们 or 学习 or 的)",
      "pinyin": "pinyin with tones (e.g. wǒmen)",
      "meaning": "concise English meaning",
      "hsk": number (1 to 6)
    }
  ],
  "vocabularyList": [
    {
      "word": "Chinese word",
      "pinyin": "pīnyīn",
      "meaning": "definition",
      "hsk": 1-6
    }
  ]
}`;

        try {
          const rawText = await callGeminiWithFallback(ai, {
            contents: prompt,
            responseMimeType: 'application/json',
            temperature: 0.2,
          });
          parsed = JSON.parse(rawText || '{}');
        } catch (genErr: any) {
          console.warn('Gemini text analysis unavailable, using high-accuracy offline analyzer:', genErr?.message);
        }
      }

      if (!parsed || !parsed.tokens || !Array.isArray(parsed.tokens) || parsed.tokens.length === 0) {
        parsed = offlineAnalyzeText(text);
      }

      res.json(parsed);
    } catch (error: any) {
      console.error('Text analysis endpoint error:', error);
      res.json(offlineAnalyzeText(req.body?.text || ''));
    }
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
