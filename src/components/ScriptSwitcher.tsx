import React from 'react';
import { Languages } from 'lucide-react';
import { ScriptMode } from '../utils/scriptConverter';

interface ScriptSwitcherProps {
  mode: ScriptMode;
  onChange: (mode: ScriptMode) => void;
}

export const ScriptSwitcher: React.FC<ScriptSwitcherProps> = ({ mode, onChange }) => {
  const variants: { id: ScriptMode; char: string; title: string }[] = [
    { id: 'simplified', char: '简', title: 'Simplified Chinese (简体中文 - Mainland / Singapore / HSK)' },
    { id: 'traditional', char: '繁', title: 'Traditional Chinese (繁體中文 - Taiwan / Hong Kong / Classical)' },
  ];

  return (
    <div className="flex items-center bg-slate-900/70 border border-slate-800/70 rounded-xl p-0.5 text-xs backdrop-blur-sm">
      <div className="flex items-center gap-1 px-1.5 h-6 text-slate-500 font-medium border-r border-slate-800/70 mr-0.5">
        <Languages className="w-3.5 h-3.5 text-slate-500" />
        <span className="hidden sm:inline text-[11px]">Script</span>
      </div>
      {variants.map((v) => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className={`px-2 py-1 rounded font-medium transition-all ${
            mode === v.id
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-200'
          }`}
          title={v.title}
        >
          {v.char}
        </button>
      ))}
    </div>
  );
};
