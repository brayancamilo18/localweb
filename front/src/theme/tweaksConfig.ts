/** LocalWeb demo · theme maps + CSS variable application */

export interface TweakValues {
  accent: 'indigo' | 'blue' | 'green' | 'amber'
  font: 'inter' | 'geist' | 'sohne'
  radius: 'sm' | 'md' | 'lg'
  plan: 'free' | 'pro'
  tone: 'cool' | 'warm'
}

export const TWEAKS_DEFAULT: TweakValues = {
  accent: 'indigo',
  font: 'sohne',
  radius: 'md',
  plan: 'free',
  tone: 'cool',
}

export type AccentKey = TweakValues['accent']

export const ACCENTS: Record<
  AccentKey,
  { c: string; h: string; s: string; r: string }
> = {
  indigo: { c: '#2563EB', h: '#1D4ED8', s: '#EFF4FF', r: 'rgba(37, 99, 235, .14)' },
  blue: { c: '#0EA5E9', h: '#0284C7', s: '#E0F2FE', r: 'rgba(14, 165, 233, .14)' },
  green: { c: '#059669', h: '#047857', s: '#ECFDF5', r: 'rgba(5, 150, 105, .14)' },
  amber: { c: '#B45309', h: '#92400E', s: '#FEF3C7', r: 'rgba(180, 83, 9, .16)' },
}

export const FONTS: Record<TweakValues['font'], string> = {
  inter: `"Inter", ui-sans-serif, system-ui, sans-serif`,
  geist: `"Geist", ui-sans-serif, system-ui, sans-serif`,
  sohne: `"Manrope", ui-sans-serif, system-ui, sans-serif`,
}

export type RadiusKey = TweakValues['radius']

export const RADII: Record<
  RadiusKey,
  { sm: string; md: string; lg: string; xl: string }
> = {
  sm: { sm: '4px', md: '6px', lg: '10px', xl: '14px' },
  md: { sm: '6px', md: '10px', lg: '14px', xl: '20px' },
  lg: { sm: '10px', md: '14px', lg: '20px', xl: '28px' },
}

export type ToneKey = TweakValues['tone']

export const TONES: Record<
  ToneKey,
  {
    bg: string
    surface: string
    text: string
    text2: string
    text3: string
    text4: string
    border: string
    border2: string
  }
> = {
  cool: {
    bg: '#F8FAFC',
    surface: '#F1F5F9',
    text: '#0F172A',
    text2: '#334155',
    text3: '#64748B',
    text4: '#94A3B8',
    border: '#E2E8F0',
    border2: '#CBD5E1',
  },
  warm: {
    bg: '#FAF8F5',
    surface: '#F1ECE3',
    text: '#1A1814',
    text2: '#403B33',
    text3: '#7A7268',
    text4: '#A89F92',
    border: '#E8E2D5',
    border2: '#D6CCB8',
  },
}

export function applyTokens(t: TweakValues): void {
  if (typeof document === 'undefined') return
  const a = ACCENTS[t.accent] ?? ACCENTS.indigo
  const r = RADII[t.radius] ?? RADII.md
  const tone = TONES[t.tone] ?? TONES.cool
  const root = document.documentElement.style

  root.setProperty('--lw-accent', a.c)
  root.setProperty('--lw-accent-hover', a.h)
  root.setProperty('--lw-accent-soft', a.s)
  root.setProperty('--lw-accent-ring', a.r)
  root.setProperty('--lw-r-sm', r.sm)
  root.setProperty('--lw-r', r.md)
  root.setProperty('--lw-r-lg', r.lg)
  root.setProperty('--lw-r-xl', r.xl)
  root.setProperty('--lw-bg', tone.bg)
  root.setProperty('--lw-surface', tone.surface)
  root.setProperty('--lw-text', tone.text)
  root.setProperty('--lw-text-2', tone.text2)
  root.setProperty('--lw-text-3', tone.text3)
  root.setProperty('--lw-text-4', tone.text4)
  root.setProperty('--lw-border', tone.border)
  root.setProperty('--lw-border-2', tone.border2)
  root.setProperty('--lw-font', FONTS[t.font] ?? FONTS.inter)
  root.setProperty('--lw-font-display', FONTS[t.font] ?? FONTS.inter)

  document.documentElement.dataset.lwPlan = t.plan
  document.documentElement.classList.add('lw')
}
