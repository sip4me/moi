export const C = {
  /** Off-black text: no pure black on pure white, less glare. */
  ink: '#1E1E1E',
  /** Muted metadata: timestamps, captions, secondary icons. */
  gray: '#6E7175',
  /** Secondary body text. */
  gray2: '#5F6368',
  line: '#F0F1F3',
  /** The soft canvas the main tabs sit on, so white cards lift by tone instead of borders. */
  bg: '#F8F9FA',
  card: '#F6F6F8',
  option: '#F5F5F5',
  pressed: '#E9E9EC',
  white: '#FFFFFF',
  gold: '#C9A24A',
  goldSoft: '#FFF8E8',
  blue: '#5B8DEF',
  green: '#6BAF7B',
  red: '#E5484D',
  greenText: '#1E7B45',
  greenSoft: '#E5F4EA',
  amberText: '#9A6400',
  amberSoft: '#FDF0D9',
};

export const F = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  serif: 'YoungSerif_400Regular',
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  /** Glamour affirmations: a high-contrast didone with ball terminals (Abril Fatface). */
  glam: 'AbrilFatface_400Regular',
};

export const evidenceStyle: Record<string, { label: string; bg: string; fg: string }> = {
  strong: { label: 'Strong evidence', bg: C.greenSoft, fg: C.greenText },
  moderate: { label: 'Some evidence', bg: '#EEF3FD', fg: '#3F6FD8' },
  expert: { label: 'Dermatologist advice', bg: '#F3EEFB', fg: '#6B4FA8' },
  lab: { label: 'Lab tests only', bg: '#F2F2F4', fg: C.gray2 },
  early: { label: 'Early evidence', bg: C.amberSoft, fg: C.amberText },
};

/**
 * Surfaces, low cognitive load: the main tabs sit on a soft off-white canvas (C.bg); content sits on
 * white cards separated by tone and a faint shadow, never by border lines; 3D objects sit on tonal
 * grey tiles with their label below.
 */
export const TILE = '#EEF0F3';
export const surface = {
  backgroundColor: '#FFFFFF', borderRadius: 24,
  shadowColor: '#1E2430', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 2,
} as const;
/** Vertical rhythm: between sections, and from a section title to its content. */
/** Calm, breathable spacing for a wellness app: 32 px between sections, 16 px from a title to its content. */
export const SPACE = { section: 32, head: 16 } as const;
/** Section content sits this much further in than its title: titles at a 20 px margin, content at 24 px. */
export const CONTENT_INDENT = 4;
export const TYPE = {
  h1: { fontFamily: F.bold, fontSize: 32, letterSpacing: -0.8, color: C.ink },
  h2: { fontFamily: F.bold, fontSize: 22, letterSpacing: -0.4, color: C.ink },
} as const;
