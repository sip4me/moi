/**
 * Tap-to-answer questions for the chat. Each answer is saved straight into the person's routine:
 * hair answers into the hair routine, lip / eye / face answers into those makeup combos, and so on.
 * Claude picks which question to ask next, but only from this list, so every answer stays tidy.
 */
import { AREA_Q, GOALS, HAIR_Q, type Area, type RoutineState } from './model';

export type Question = { key: string; area: Area; q: string; options: string[]; max?: number };

const HAIR_TEXT: Record<string, string> = {
  texture: 'What’s your hair texture?', strands: 'How thick are your strands?', heat: 'How often do you use heat?',
  treated: 'Is your hair colored or chemically treated?', scalp: 'How does your scalp usually feel?', budget: 'What’s your monthly budget for products?',
};
const AREA_TEXT: Record<string, string> = {
  skin_type: 'What’s your skin type?', skin_concerns: 'What would you most like to improve?', skin_flags: 'Anything to avoid?',
  mk_tone: 'Which is closest to your skin tone?', mk_undertone: 'What’s your undertone?', mk_coverage: 'How much coverage do you like?',
  mk_finish: 'What finish do you like on your skin?', mk_face_look: 'Which face look is most you?', mk_eye_look: 'Which eye look do you go for?',
  mk_lip_look: 'Which lip look do you love?', mk_musts: 'Any must-haves?', body_feel: 'How does your body skin feel?', body_concerns: 'Any body skin concerns?',
};

export const QUESTIONS: Question[] = [
  // Habits first: easy to answer, and they shape the routine.
  { key: 'hair_wash', area: 'hair', q: 'How often do you wash your hair?', options: ['Every day', '2–3× a week', 'Once a week', 'Less often'] },
  { key: 'goals', area: 'hair', q: 'What do you want most for your hair?', options: GOALS, max: 3 },
  ...HAIR_Q.map(h => ({ key: `hair.${h.key}`, area: 'hair' as Area, q: HAIR_TEXT[h.key] ?? h.label, options: h.options })),
  { key: 'mk_daily', area: 'makeup', q: 'How much makeup do you wear most days?', options: ['None', 'A few things', 'A full face'] },
  { key: 'mk_time', area: 'makeup', q: 'How long do you spend on makeup?', options: ['Under 5 min', '5–15 min', '15+ min'] },
  { key: 'lip_daily', area: 'makeup', q: 'What’s on your lips most days?', options: ['Nothing', 'Balm', 'Gloss', 'Lipstick', 'Liner + gloss'] },
  { key: 'eye_daily', area: 'makeup', q: 'And on your eyes?', options: ['Nothing', 'Mascara only', 'Liner', 'Shadow + liner'] },
  { key: 'skin_night', area: 'skin', q: 'How many skin steps do you do at night?', options: ['None', 'Just cleanse', '2–3 steps', '4+ steps'] },
  ...AREA_Q.map(a => ({ key: a.key, area: a.area, q: AREA_TEXT[a.key] ?? a.label, options: a.options, ...(a.max ? { max: a.max } : {}) })),
];
export const QUESTION = (key: string) => QUESTIONS.find(q => q.key === key);

/** What's already answered, so the chat doesn't ask again. */
export function answered(s: RoutineState): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const q of QUESTIONS) {
    const v = q.key === 'goals' ? s.goals : q.key.startsWith('hair.') ? [s.hair[q.key.slice(5) as keyof typeof s.hair]].filter(Boolean) as string[] : s.prefs?.[q.key] ?? [];
    if (v.length) out[q.key] = v;
  }
  return out;
}

const WASH_DAYS: Record<string, number[]> = { 'Every day': [0, 1, 2, 3, 4, 5, 6], '2–3× a week': [0, 3, 5], 'Once a week': [0], 'Less often': [0] };

/** Saves one tapped answer into the routine (and the matching hair routine or makeup combo). */
export function applyAnswer(s: RoutineState, key: string, value: string): RoutineState {
  const q = QUESTION(key);
  if (!q || !q.options.includes(value)) return s;
  const areas = (s.areas ?? []).includes(q.area) ? s.areas : [...(s.areas ?? []), q.area];
  const prefs = { ...(s.prefs ?? {}) };
  const setPref = (k: string, v: string, max = 1) => {
    const cur = prefs[k] ?? [];
    prefs[k] = max === 1 ? [v] : cur.includes(v) ? cur : [...cur.filter(x => x !== 'Nothing'), v].slice(-max);
  };
  let next: RoutineState = { ...s, areas };
  if (key === 'goals') next.goals = s.goals.includes(value) ? s.goals : [...s.goals, value].slice(-3);
  else if (key.startsWith('hair.')) next.hair = { ...s.hair, [key.slice(5)]: value };
  else setPref(key, value, q.max ?? 1);
  // Habits that decide the routine itself.
  if (key === 'hair_wash') next.washDays = WASH_DAYS[value];
  if (key === 'lip_daily') { const look = ({ Gloss: 'Glossy', 'Liner + gloss': 'Lip contour' } as Record<string, string>)[value]; if (look) prefs.mk_lip_look = [look]; }
  if (key === 'eye_daily' && value === 'Mascara only') prefs.mk_eye_look = ['Barely there'];
  if (key === 'mk_daily' && value === 'None') prefs.mk_face_look = ['Skin first'];
  next = { ...next, prefs };
  return next;
}
