export type ThemePreset = 'obsidian' | 'parchment' | 'bamboo' | 'ink';
export type FontSizeScale = 'compact' | 'standard' | 'large';

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  chinese: string;
  tagline: string;
  rootClass: string;
  bgMain: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  accentBadge: string;
  previewPalette: [string, string, string];
}

export const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = {
  obsidian: {
    id: 'obsidian',
    name: 'Dusk Obsidian',
    chinese: '暮夜黑',
    tagline: 'Warm near-black night mode with luminous jade accents. Optimised for low-light focus.',
    rootClass: 'theme-obsidian bg-slate-950 text-slate-100',
    bgMain: 'bg-slate-950',
    cardBg: 'bg-slate-900/90',
    cardBorder: 'border-slate-800',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    accentColor: '#10b981',
    accentBadge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    previewPalette: ['#020617', '#0f172a', '#10b981'],
  },
  parchment: {
    id: 'parchment',
    name: 'Rice Paper & Ink',
    chinese: '宣纸暖白',
    tagline: 'Warm ivory rice-paper surfaces with jade-green teaching accents and subtle vermilion seals. Gentle, high-contrast and print-friendly.',
    rootClass: 'theme-parchment bg-slate-950 text-slate-100',
    bgMain: 'bg-slate-950',
    cardBg: 'bg-slate-900',
    cardBorder: 'border-slate-800',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    accentColor: '#1f9461',
    accentBadge: 'bg-emerald-500/12 text-emerald-500 border-emerald-500/25',
    previewPalette: ['#f4eddc', '#fffdf6', '#1f9461'],
  },
  bamboo: {
    id: 'bamboo',
    name: 'Jade Bamboo Grove',
    chinese: '竹林深青',
    tagline: 'Deep botanical celadon inspired by traditional Chinese gardens, with luminous jade radial accents.',
    rootClass: 'theme-bamboo bg-slate-950 text-slate-100',
    bgMain: 'bg-slate-950',
    cardBg: 'bg-slate-900/90',
    cardBorder: 'border-slate-800',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    accentColor: '#10b981',
    accentBadge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    previewPalette: ['#020617', '#0f172a', '#10b981'],
  },
  ink: {
    id: 'ink',
    name: 'Ink & Vermilion Seal',
    chinese: '水墨丹青',
    tagline: 'High-contrast graphite monochrome with cinnabar seal-red highlights for purist character study.',
    rootClass: 'theme-ink bg-slate-950 text-slate-100',
    bgMain: 'bg-slate-950',
    cardBg: 'bg-slate-900/90',
    cardBorder: 'border-slate-800',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    accentColor: '#f43f5e',
    accentBadge: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
    previewPalette: ['#020617', '#1e293b', '#f43f5e'],
  },
};
