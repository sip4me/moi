export const C = {
  ink: '#0A0A0A',
  gray: '#8A8A8A',
  gray2: '#6B6B6B',
  line: '#EDEDED',
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
};

export const evidenceStyle: Record<string, { label: string; bg: string; fg: string }> = {
  strong: { label: 'Strong evidence', bg: C.greenSoft, fg: C.greenText },
  moderate: { label: 'Some evidence', bg: '#EEF3FD', fg: '#3F6FD8' },
  expert: { label: 'Dermatologist advice', bg: '#F3EEFB', fg: '#6B4FA8' },
  lab: { label: 'Lab tests only', bg: '#F2F2F4', fg: C.gray2 },
  early: { label: 'Early evidence', bg: C.amberSoft, fg: C.amberText },
};

/**
 * Surfaces, in the Airbnb spirit: the page is white; content sits on white cards lifted by a soft
 * shadow (no grey boxes, no heavy borders); 3D objects sit on light-grey tiles with their label below.
 */
export const TILE = '#F7F7F7';
export const surface = {
  backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 3,
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
