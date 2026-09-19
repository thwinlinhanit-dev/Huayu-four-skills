import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string> {
  id: T;
  label: string;
  sublabel?: string;
  chinese?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface ModernDropdownProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  accentColor?: 'emerald' | 'sky' | 'purple' | 'amber';
  placeholder?: string;
  className?: string;
}

export function ModernDropdown<T extends string>({
  value,
  onChange,
  options,
  accentColor = 'emerald',
  className = '',
}: ModernDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const colorStyles = {
    emerald: {
      button: 'hover:border-emerald-500/50 focus:border-emerald-500 text-emerald-400 bg-emerald-500/10',
      activeItem: 'bg-emerald-500/20 text-emerald-300 font-semibold',
      accentText: 'text-emerald-400',
      check: 'text-emerald-400',
    },
    sky: {
      button: 'hover:border-sky-500/50 focus:border-sky-500 text-sky-400 bg-sky-500/10',
      activeItem: 'bg-sky-500/20 text-sky-300 font-semibold',
      accentText: 'text-sky-400',
      check: 'text-sky-400',
    },
    purple: {
      button: 'hover:border-purple-500/50 focus:border-purple-500 text-purple-400 bg-purple-500/10',
      activeItem: 'bg-purple-500/20 text-purple-300 font-semibold',
      accentText: 'text-purple-400',
      check: 'text-purple-400',
    },
    amber: {
      button: 'hover:border-amber-500/50 focus:border-amber-500 text-amber-400 bg-amber-500/10',
      activeItem: 'bg-amber-500/20 text-amber-300 font-semibold',
      accentText: 'text-amber-400',
      check: 'text-amber-400',
    },
  }[accentColor];

  const SelectedIcon = selectedOption?.icon;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-all shadow-sm focus:outline-none ${
          isOpen ? 'border-slate-700 ring-1 ring-slate-700' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {SelectedIcon && (
            <span className={`p-1 rounded-md ${colorStyles.button}`}>
              <SelectedIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          )}
          <span className="font-semibold text-slate-100">{selectedOption?.label}</span>
          {selectedOption?.chinese && (
            <span className="text-xs text-slate-400 font-serif">({selectedOption.chinese})</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-1 text-slate-400">
          <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            {options.length}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          <div className="p-1.5 max-h-96 overflow-y-auto space-y-1 divide-y divide-slate-800/50">
            <div className="px-2.5 py-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select View / Tool
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Quick Navigation</span>
            </div>

            <div className="pt-1 space-y-0.5">
              {options.map((option) => {
                const isSelected = option.id === value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left text-xs transition-all ${
                      isSelected
                        ? `${colorStyles.activeItem} border border-slate-700/50`
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {Icon && (
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected ? colorStyles.button : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-100">{option.label}</span>
                          {option.chinese && (
                            <span className="text-xs text-slate-400 font-serif">
                              {option.chinese}
                            </span>
                          )}
                        </div>
                        {option.sublabel && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {option.sublabel}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className={`w-4 h-4 flex-shrink-0 ${colorStyles.check}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
