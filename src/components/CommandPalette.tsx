/* ── Global command palette (Ctrl+K) ─────────────────────────────
   One fuzzy search box that jumps to any character, story, exercise,
   phrase, chengyu, twister or radical across all four skills, with
   full keyboard navigation (↑ ↓ Enter Esc). */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import { SkillTab } from '../types';
import { SearchHit, kindIcon, kindLabel, searchContent } from '../utils/searchIndex';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onJump: (tab: SkillTab, ref: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onJump }) => {
  const [query, setQuery] = useState<string>('');
  const [active, setActive] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const hits: SearchHit[] = useMemo(() => (isOpen ? searchContent(query, 24) : []), [query, isOpen]);

  /* Reset + autofocus when opened */
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  /* Keyboard: ↑ ↓ navigate, Enter jumps, Escape closes */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((v) => Math.min(v + 1, Math.max(0, hits.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((v) => Math.max(0, v - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const hit = hits[active];
        if (hit) {
          onJump(hit.doc.tab, hit.doc.ref);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, hits, active, onClose, onJump]);

  /* Keep the active row visible */
  useEffect(() => {
    const rows = listRef.current?.querySelectorAll('[data-hit-row]');
    if (rows && rows[active]) rows[active].scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!isOpen) return null;

  const grouped = groupByKind(hits);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
      className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] px-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search characters, stories, listening, phrases, chengyu…"
            className="w-full h-12 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
            aria-label="Search all content"
          />
          <kbd className="hidden sm:block text-[10px] text-slate-500 border border-slate-700 rounded px-1.5 py-0.5 font-mono">
            esc
          </kbd>
        </div>
        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2" role="listbox" aria-label="Search results">
          {hits.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              {query.trim() === ''
                ? 'Type to search every skill at once — try 「好」 or "ni hao"'
                : 'No matches. Try fewer characters or plain pinyin without tones.'}
            </div>
          ) : (
            <div>
              {grouped.map((g) => (
                <div key={g.kind} className="mb-1">
                  <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1.5">
                    <span className="font-serif">{kindIcon(g.kind)}</span>
                    {kindLabel(g.kind)}
                  </div>
                  {g.hits.map((h) => {
                    const idx = hits.indexOf(h);
                    const isActive = idx === active;
                    return (
                      <button
                        key={h.doc.id}
                        data-hit-row
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => {
                          onJump(h.doc.tab, h.doc.ref);
                          onClose();
                          setActive(0);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                          isActive ? 'bg-slate-800 ring-1 ring-emerald-500/40' : 'hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="font-serif text-lg text-slate-100 w-9 text-center shrink-0">
                          {h.doc.title.slice(0, 4)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-slate-200 truncate">{h.doc.subtitle}</span>
                          {h.doc.level && <span className="text-[10px] text-slate-500 font-mono">{h.doc.level}</span>}
                        </span>
                        {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function groupByKind(hits: SearchHit[]): { kind: SearchHit['doc']['kind']; hits: SearchHit[] }[] {
  const map = new Map<string, SearchHit[]>();
  for (const h of hits) {
    const arr = map.get(h.doc.kind) || [];
    arr.push(h);
    map.set(h.doc.kind, arr);
  }
  return [...map.entries()].map(([kind, hs]) => ({ kind: kind as SearchHit['doc']['kind'], hits: hs }));
}

