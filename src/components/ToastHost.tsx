/* ── Toast notifications ─────────────────────────────────────────
   Tiny event-bus toasts with aria-live announcements for
   accessibility (roadmap #8, #13). Fires `huayu:toast` events:
   window.dispatchEvent(new CustomEvent('huayu:toast', {
     detail: { message, icon?, tone? }
   })) */

import React, { useEffect, useState } from 'react';

export type ToastTone = 'default' | 'success' | 'xp' | 'warn';

export interface ToastPayload {
  message: string;
  icon?: string;
  tone?: ToastTone;
  /** Auto-dismiss ms (default 4200) */
  duration?: number;
}

export function pushToast(payload: ToastPayload) {
  window.dispatchEvent(new CustomEvent<ToastPayload>('huayu:toast', { detail: payload }));
}

interface ToastItem extends Required<Pick<ToastPayload, 'message'>> {
  id: number;
  icon: string;
  tone: ToastTone;
  duration: number;
}

let toastSeq = 0;

export const ToastHost: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      if (!detail?.message) return;
      const item: ToastItem = {
        id: ++toastSeq,
        message: detail.message,
        icon: detail.icon ?? '✨',
        tone: detail.tone ?? 'default',
        duration: detail.duration ?? 4200,
      };
      setToasts((prev) => [...prev.slice(-3), item]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, item.duration);
    };
    window.addEventListener('huayu:toast', onToast);
    return () => window.removeEventListener('huayu:toast', onToast);
  }, []);

  const toneCls: Record<ToastTone, string> = {
    default: 'border-slate-700 bg-slate-900/95',
    success: 'border-emerald-500/50 bg-emerald-500/15',
    xp: 'border-amber-500/50 bg-amber-500/15',
    warn: 'border-rose-500/50 bg-rose-500/15',
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[80] flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs text-slate-100 animate-toast-in ${toneCls[t.tone]}`}
        >
          <span className="text-base leading-none">{t.icon}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
