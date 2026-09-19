// Mandarin Speech Synthesis and Tone Audio Oscillator Utilities

export function playMandarinAudio(text: string, rate: number = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      resolve();
      return;
    }

    window.speechSynthesis.cancel(); // Cancel any previous speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Try finding a native zh-CN voice if available
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(
      (v) => v.lang.startsWith('zh-CN') || v.lang.startsWith('zh') || v.lang.includes('Chinese')
    );
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Synthesizes pure musical frequency tone contours for Mandarin tones (1 to 4)
 * Tone 1: High Level (55) -> ~280Hz flat
 * Tone 2: High Rising (35) -> ~200Hz -> ~280Hz
 * Tone 3: Falling-Rising (214) -> ~210Hz -> ~150Hz -> ~240Hz
 * Tone 4: High Falling (51) -> ~300Hz -> ~140Hz
 */
export function playToneOscillator(tone: 1 | 2 | 3 | 4, duration: number = 0.65): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    // Set gain envelope to avoid clicking
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
    gain.gain.setValueAtTime(0.3, now + duration - 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Apply pitch contour based on Mandarin tones (5-pitch Chao scale)
    switch (tone) {
      case 1: // 55: High flat
        osc.frequency.setValueAtTime(290, now);
        osc.frequency.linearRampToValueAtTime(290, now + duration);
        break;
      case 2: // 35: Rising
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(290, now + duration);
        break;
      case 3: // 214: Dipping (falling-rising)
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + duration * 0.45);
        osc.frequency.exponentialRampToValueAtTime(250, now + duration);
        break;
      case 4: // 51: High falling
        osc.frequency.setValueAtTime(310, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + duration);
        break;
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, (duration + 0.2) * 1000);
  } catch (err) {
    console.error('Tone oscillator error:', err);
  }
}

export const TONE_COLORS: Record<number, { text: string; bg: string; border: string; desc: string }> = {
  1: { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/40', desc: '1st Tone: High Flat (55) ˉ' },
  2: { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/40', desc: '2nd Tone: Rising (35) ˊ' },
  3: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', desc: '3rd Tone: Dipping (214) ˇ' },
  4: { text: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/40', desc: '4th Tone: Falling (51) ˋ' },
  5: { text: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/40', desc: 'Neutral Tone: Light' },
};

/* ── Audio engine capability detection ─────────────────────────
   The Web Speech API (speechSynthesis / SpeechRecognition) is
   Chromium-only today. Expose detection so the UI can degrade
   gracefully and surface a "sound engine unavailable" chip. */

export function isTtsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSttAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  );
}

export interface AudioEngineStatus {
  tts: boolean;
  stt: boolean;
}

export function audioEngineStatus(): AudioEngineStatus {
  return { tts: isTtsAvailable(), stt: isSttAvailable() };
}
