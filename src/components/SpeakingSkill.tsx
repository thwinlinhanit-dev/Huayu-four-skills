import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Bot,
  Send,
  RotateCcw,
  CheckCircle2,
  MessageSquare,
  Flame,
  Award,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SpeakingPhrase } from '../types';
import { playMandarinAudio, isTtsAvailable, isSttAvailable } from '../utils/audio';
import { SPEAKING_PHRASES } from '../data/chineseData';
import { TongueTwisters } from './TongueTwisters';
import { ShadowingPlayer } from './ShadowingPlayer';
import { ModernDropdown } from './ModernDropdown';
import { PitchComparator } from './PitchComparator';

interface Message {
  id: string;
  sender: 'user' | 'tutor';
  chinese: string;
  pinyin?: string;
  english?: string;
  grammarTip?: string;
}

export const SpeakingSkill: React.FC = () => {
  const [subTab, setSubTab] = useState<'pronunciation' | 'pitchComparator' | 'shadowing' | 'tongueTwisters' | 'aiChat'>('pronunciation');

  // Pronunciation State
  const [selectedPhrase, setSelectedPhrase] = useState<SpeakingPhrase>(SPEAKING_PHRASES[0]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [toneAdvice, setToneAdvice] = useState<string | null>(null);
  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [micSupported, setMicSupported] = useState<boolean>(true);

  // AI Chat Tutor State
  const [scenario, setScenario] = useState<string>('Daily Chat & Making Friends');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'tutor',
      chinese: '你好！我是你的中文口语助教。你想聊点什么呢？',
      pinyin: 'Nǐ hǎo! Wǒ shì nǐ de zhōngwén kǒuyǔ zhùjiào. Nǐ xiǎng liáo diǎn shénme ne?',
      english: 'Hello! I am your Chinese speaking tutor. What would you like to chat about?',
      grammarTip: '“想” (xiǎng) is used before a verb to express wanting or desiring to do something.',
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [suggestedReplies, setSuggestedReplies] = useState<any[]>([
    { chinese: '我想练习点咖啡。', pinyin: 'Wǒ xiǎng liànxí diǎn kāfēi.', english: 'I want to practice ordering coffee.' },
    { chinese: '今天天气怎么样？', pinyin: 'Jīntiān tiānqì zěnmeyàng?', english: 'How is the weather today?' },
  ]);

  const recognitionRef = useRef<any>(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicSupported(false);
    }
  }, []);

  const handlePlayTargetAudio = () => {
    playMandarinAudio(selectedPhrase.chinese, 0.8);
  };

  const handleStartRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setTranscript('');
        setScore(null);
        setFeedback(null);
      };

      recognition.onresult = async (event: any) => {
        const spoken = event.results[0][0].transcript;
        setTranscript(spoken);
        setIsRecording(false);
        await evaluateSpoken(spoken);
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const evaluateSpoken = async (spoken: string) => {
    setIsAssessing(true);
    try {
      const res = await fetch('/api/speech/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetText: selectedPhrase.chinese,
          targetPinyin: selectedPhrase.pinyin,
          spokenText: spoken,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setScore(data.accuracyScore || 85);
        setFeedback(data.feedback);
        setToneAdvice(data.toneAdvice);

        if ((data.accuracyScore || 85) >= 80) {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        }
      } else {
        // Fallback calculation
        const isMatch = spoken.replace(/[^\u4e00-\u9fa5]/g, '') === selectedPhrase.chinese.replace(/[^\u4e00-\u9fa5]/g, '');
        const fallbackScore = isMatch ? 95 : 70;
        setScore(fallbackScore);
        setFeedback(isMatch ? 'Excellent pronunciation match!' : `Target was "${selectedPhrase.chinese}". Keep practicing tones!`);
      }
    } catch (err) {
      console.error(err);
      setScore(80);
      setFeedback('Spoken attempt recorded. Keep practicing!');
    } finally {
      setIsAssessing(false);
    }
  };

  // AI Conversation Tutor Call — SSE streaming with graceful fallback
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      chinese: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    const streamingId = `t-${Date.now()}`;
    let acc = '';

    const applyMeta = (meta: any) => {
      if (!meta || !meta.replyChinese) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? {
                ...m,
                chinese: meta.replyChinese,
                pinyin: meta.replyPinyin,
                english: meta.replyEnglish,
                grammarTip: meta.grammarTip,
              }
            : m
        )
      );
      if (meta.suggestedReplies && meta.suggestedReplies.length > 0) {
        setSuggestedReplies(meta.suggestedReplies);
      }
      playMandarinAudio(meta.replyChinese, 0.9);
    };

    // Optimistic placeholder bubble that fills in as tokens stream
    setMessages((prev) => [...prev, { id: streamingId, sender: 'tutor', chinese: '' }]);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.chinese,
      }));

      const res = await fetch('/api/conversation/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, scenario, history: historyPayload }),
      });

      if (!res.ok || !res.body) throw new Error(`stream unavailable (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let sawDelta = false;

      // Parse the SSE byte stream: split frames on blank lines
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const frames = buf.split('\n\n');
        buf = frames.pop() ?? '';
        for (const frame of frames) {
          const lines = frame.split('\n');
          const evLine = lines.find((l) => l.startsWith('event: '));
          const dataLine = lines.find((l) => l.startsWith('data: '));
          if (!dataLine) continue;
          const event = evLine?.slice(7).trim() || 'message';
          let payload: any;
          try {
            payload = JSON.parse(dataLine.slice(6));
          } catch {
            continue;
          }

          if (event === 'delta' && payload.text) {
            sawDelta = true;
            acc += payload.text;
            // Try to show partial JSON content: extract replyChinese so far
            const m = acc.match(/"replyChinese"\s*:\s*"((?:[^"\\]|\\.)*)/);
            const partial = m
              ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
              : '';
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === streamingId ? { ...msg, chinese: partial || '…' } : msg
              )
            );
            // If the JSON is now complete, finalize with metadata
            try {
              const meta = JSON.parse(acc);
              applyMeta(meta);
            } catch {
              /* still streaming */
            }
          } else if (event === 'done') {
            if (sawDelta) {
              try {
                applyMeta(JSON.parse(acc));
              } catch {
                /* keep partial text */
              }
            }
          }
        }
      }

      if (!sawDelta) {
        // No stream frames — fall back to the non-streaming endpoint
        const fb = await fetch('/api/conversation/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, scenario, history: historyPayload }),
        });
        if (fb.ok) applyMeta(await fb.json());
      }
    } catch (err) {
      console.error('Streaming chat failed, falling back:', err);
      try {
        const historyPayload = messages.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.chinese,
        }));
        const fb = await fetch('/api/conversation/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, scenario, history: historyPayload }),
        });
        if (fb.ok) applyMeta(await fb.json());
        else throw new Error('fallback failed');
      } catch {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingId
              ? {
                  ...msg,
                  chinese: '抱歉，连接出错了。请再试一次！',
                  pinyin: 'Bàoqiàn, liánjiē chū cuò le. Qǐng zài shì yī cì!',
                  english: 'Sorry, connection error. Please try again!',
                }
              : msg
          )
        );
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Speaking Skill · 口语发音
            </h2>
            <p className="text-xs text-slate-400">Pronunciation clinic with speech recognition & AI conversational tutor</p>
          </div>
          {(!isSttAvailable() || !isTtsAvailable()) && (
            <span
              title="This browser lacks speech recognition and/or speech synthesis — some drills are disabled. Use Chrome or Edge for the full experience."
              className="ml-2 inline-flex items-center gap-1 h-6 px-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-[10px] font-bold text-amber-400"
            >
              <MicOff className="w-3 h-3" /> Limited audio
            </span>
          )}
        </div>

        {/* Speaking Mode Dropdown Selector */}
        <div className="flex items-center">
          <ModernDropdown<'pronunciation' | 'pitchComparator' | 'shadowing' | 'tongueTwisters' | 'aiChat'>
            value={subTab}
            onChange={setSubTab}
            accentColor="purple"
            options={[
              {
                id: 'pronunciation',
                label: 'Pronunciation Clinic',
                chinese: '发音测评',
                sublabel: 'Browser speech recognition & instant tone/pinyin scoring',
                icon: Mic,
              },
              {
                id: 'pitchComparator',
                label: 'Tone Pitch Comparator',
                chinese: '音调对比仪',
                sublabel: 'Live acoustic F0 pitch curves vs Chao 5-scale native model',
                icon: Sparkles,
              },
              {
                id: 'shadowing',
                label: 'Shadowing Player',
                chinese: '跟读回放',
                sublabel: 'Repeat after native speaker audio with waveform recording',
                icon: Volume2,
              },
              {
                id: 'tongueTwisters',
                label: 'Tongue Twisters',
                chinese: '绕口令',
                sublabel: 'Speed challenges targeting tricky finals (s/sh, l/n, h/f)',
                icon: Flame,
              },
              {
                id: 'aiChat',
                label: 'AI Conversation Partner',
                chinese: 'AI陪练',
                sublabel: 'Interactive roleplay conversations with Pinyin & grammar tips',
                icon: Bot,
              },
            ]}
          />
        </div>
      </div>

      {/* SUB-TAB 1: PRONUNCIATION CLINIC */}
      {subTab === 'pronunciation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Speech Practice Console */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
                {selectedPhrase.category} · {selectedPhrase.difficulty}
              </span>
              <button
                onClick={handlePlayTargetAudio}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen Model Audio</span>
              </button>
            </div>

            {/* Target Chinese Sentence Display */}
            <div className="my-3">
              <h3 className="font-serif text-3xl sm:text-4xl font-black text-slate-100 mb-2 tracking-tight">
                {selectedPhrase.chinese}
              </h3>
              <p className="text-base font-semibold text-purple-400 font-mono tracking-wide">
                {selectedPhrase.pinyin}
              </p>
              <p className="text-xs text-slate-400 mt-1 italic">{selectedPhrase.english}</p>
            </div>

            {/* Microphone Button */}
            <div className="my-6 flex flex-col items-center">
              <button
                id="btn-record-speech"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-rose-950/60 ring-4 ring-rose-500/30'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-purple-950/40 hover:from-purple-500 hover:to-indigo-400'
                }`}
              >
                {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                <span className="text-[10px] font-bold uppercase tracking-wider mt-1">
                  {isRecording ? 'Listening...' : 'Tap to Speak'}
                </span>
              </button>

              {!micSupported && (
                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Speech recognition requires microphone permissions or Chrome.</span>
                </p>
              )}
            </div>

            {/* What was heard & Score Assessment */}
            {isAssessing && (
              <div className="text-xs text-purple-400 animate-pulse my-2">
                Evaluating pronunciation with AI speech analyzer...
              </div>
            )}

            {transcript && !isAssessing && (
              <div className="w-full mt-2 p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    What we heard:
                  </span>
                  {score !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Accuracy:</span>
                      <span
                        className={`text-base font-black ${
                          score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}
                      >
                        {score}%
                      </span>
                    </div>
                  )}
                </div>

                <p className="font-serif text-lg font-bold text-slate-200">“{transcript}”</p>

                {feedback && (
                  <p className="text-xs text-slate-300 pt-2 border-t border-slate-800/80 leading-relaxed">
                    <strong>Feedback:</strong> {feedback}
                  </p>
                )}

                {toneAdvice && (
                  <p className="text-xs text-emerald-400 font-medium">
                    <strong>Tone Tip:</strong> {toneAdvice}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Practice Phrases Library */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Practice Library (选择练习句子)
            </h3>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {SPEAKING_PHRASES.map((phrase) => {
                const isSelected = selectedPhrase.id === phrase.id;
                return (
                  <button
                    key={phrase.id}
                    onClick={() => {
                      setSelectedPhrase(phrase);
                      setTranscript('');
                      setScore(null);
                      setFeedback(null);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/20'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-medium">
                        {phrase.category}
                      </span>
                      <span className="text-[10px] text-slate-500">{phrase.difficulty}</span>
                    </div>
                    <p className="font-serif font-bold text-base text-slate-200">{phrase.chinese}</p>
                    <p className="text-xs text-purple-400 font-mono">{phrase.pinyin}</p>
                    <p className="text-[11px] text-slate-400 italic truncate">{phrase.english}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AI CONVERSATION PARTNER */}
      {subTab === 'aiChat' && (
        <div className="max-w-4xl mx-auto bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
          {/* Scenario Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-200">Mandarin AI Speaking Tutor</h3>
                <p className="text-xs text-slate-400">Practice natural conversations in Chinese</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Scenario:</span>
              <select
                value={scenario}
                onChange={(e) => {
                  setScenario(e.target.value);
                  setMessages([
                    {
                      id: 'm-sc',
                      sender: 'tutor',
                      chinese: `你好！我们现在练习场景：${e.target.value}。请先开口说一句吧！`,
                      pinyin: `Nǐ hǎo! Wǒmen xiànzài liànxí chǎngjǐng: ${e.target.value}. Qǐng xiān kāikǒu shuō yījù ba!`,
                      english: `Hello! We are now practicing the scenario: ${e.target.value}. Please speak first!`,
                    },
                  ]);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="Daily Chat & Making Friends">Daily Chat & Making Friends (日常生活)</option>
                <option value="Ordering Coffee or Food">Ordering Coffee or Food (咖啡馆点餐)</option>
                <option value="Asking for Directions">Asking for Directions (街头问路)</option>
                <option value="Bargaining at Market">Bargaining at Market (市场购物砍价)</option>
                <option value="Airport Check-in & Boarding">Airport Check-in & Boarding (机场值机乘机)</option>
                <option value="Job Interview in Mandarin">Job Interview in Mandarin (求职职场面试)</option>
                <option value="Doctor Visit & Pharmacy">Doctor Visit & Pharmacy (医院看病与药房)</option>
                <option value="Hotel Booking & Check-in">Hotel Booking & Check-in (酒店入住问询)</option>
              </select>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="space-y-4 min-h-[320px] max-h-[420px] overflow-y-auto p-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-1.5 shadow-lg ${
                    m.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-serif text-lg font-bold">{m.chinese}</p>
                    {m.sender === 'tutor' && (
                      <button
                        onClick={() => playMandarinAudio(m.chinese, 0.9)}
                        className="p-1 rounded-md bg-slate-900 text-purple-400 hover:text-white"
                        title="Listen to Chinese pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {m.pinyin && <p className="text-xs text-purple-300 font-mono">{m.pinyin}</p>}
                  {m.english && <p className="text-xs text-slate-400 italic">{m.english}</p>}

                  {m.grammarTip && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-medium">
                      💡 <strong>Grammar Tip:</strong> {m.grammarTip}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-purple-400 animate-pulse">
                <Bot className="w-4 h-4" />
                <span>Tutor is thinking and generating reply with pinyin...</span>
              </div>
            )}
          </div>

          {/* Suggested Quick Replies */}
          {suggestedReplies.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-500">Quick ideas:</span>
              {suggestedReplies.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.chinese)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-xs text-slate-300 hover:text-purple-300 transition-all font-serif"
                >
                  {s.chinese}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Type Chinese or Pinyin (e.g. 你好, 我想喝咖啡)..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-slate-950 font-bold transition-all shadow-lg shadow-purple-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB: PITCH COMPARATOR (音调对比仪) */}
      {subTab === 'pitchComparator' && <PitchComparator />}

      {/* SUB-TAB: TONGUE TWISTERS (绕口令) */}
      {subTab === 'tongueTwisters' && <TongueTwisters />}

      {/* SUB-TAB: SHADOWING PLAYER (跟读回放) */}
      {subTab === 'shadowing' && <ShadowingPlayer />}
    </div>
  );
};
