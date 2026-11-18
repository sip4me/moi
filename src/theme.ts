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
