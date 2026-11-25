/**
 * Tap-to-answer questions for the chat. Each answer is saved straight into the person's routine:
 * hair answers into the hair routine, lip / eye / face answers into those makeup combos, and so on.
 * Claude picks which question to ask next, but only from this list, so every answer stays tidy.
 */
import { AREA_Q, GOALS, HAIR_Q, OCCASIONS, type Area, type RoutineState } from './model';

export type Question = { key: string; area: Area | 'fragrance' | 'tools' | 'wellness'; q: string; options: string[]; max?: number };
const ROUTINE_AREAS: Area[] = ['hair', 'skin', 'makeup', 'body'];

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
  // Narrowing: which part of each routine type to start with, then a preference.
  // First, which routine it's for (these match how Moi organises each routine), then a narrower pick.
  { key: 'hair_focus', area: 'hair', q: 'Is this for everyday, wash day, or an occasion?', options: ['Everyday', 'Wash day', 'Occasions'] },
  { key: 'hair_occasion', area: 'hair', q: 'Which occasion?', options: OCCASIONS },
  { key: 'skin_focus', area: 'skin', q: 'Is this for your morning, evening, or weekly routine?', options: ['Morning', 'Evening', 'Weekly'] },
  { key: 'makeup_when', area: 'makeup', q: 'Is this for everyday, work, going out, or a special occasion?', options: ['Everyday', 'Work', 'Going out', 'Special occasion'] },
  { key: 'makeup_focus', area: 'makeup', q: 'Face, eyes, or lips?', options: ['Face', 'Eyes', 'Lips', 'All three'] },
  { key: 'body_focus', area: 'body', q: 'Is this for the shower, after, or a weekly treat?', options: ['In the shower', 'After the shower', 'Weekly treat'] },
  // Follow-ups for each segment.
  { key: 'hair_everyday', area: 'hair', q: 'How do you usually wear it?', options: ['Natural', 'Heat styled', 'Protective style', 'Ponytail or bun'] },
  { key: 'skin_feel', area: 'skin', q: 'What textures do you like on your skin?', options: ['Lightweight', 'Rich and creamy', 'No preference'] },
  { key: 'body_scent', area: 'body', q: 'Scented or unscented?', options: ['Unscented', 'Lightly scented', 'Love a strong scent'] },
  { key: 'fragrance_strength', area: 'fragrance', q: 'How strong do you like it?', options: ['Soft skin scent', 'Noticeable', 'Long-lasting and strong'] },
  { key: 'hair_tools', area: 'tools', q: 'Which hair tool?', options: ['Dryer', 'Straightener', 'Curler or wand', 'Diffuser', 'Brush'] },
  { key: 'skin_tools', area: 'tools', q: 'Which skin tool?', options: ['Cleansing brush', 'Gua sha or roller', 'LED mask', 'Pore vacuum'] },
  { key: 'wellness_time', area: 'wellness', q: 'How much time do you have for it?', options: ['5 minutes', '15 minutes', '30 minutes or more'] },
  // Shades, for pigmented makeup.
  { key: 'lip_shade', area: 'makeup', q: 'Which lip shades do you reach for?', options: ['Nude', 'Pink', 'Rose', 'Berry', 'Red', 'Brown', 'Coral'], max: 2 },
  { key: 'cheek_shade', area: 'makeup', q: 'And for cheeks?', options: ['Peach', 'Pink', 'Rose', 'Terracotta', 'Berry', 'Bronze'], max: 2 },
  { key: 'eye_shade', area: 'makeup', q: 'Which eye colours do you like?', options: ['Browns and neutrals', 'Pinks and mauves', 'Golds and bronzes', 'Black and smoky', 'Colourful'], max: 2 },
  // Favourite brands so far, per segment.
  { key: 'brands_makeup', area: 'makeup', q: 'Any favourite makeup brands so far?', options: ['e.l.f.', 'Maybelline', 'NYX', 'Fenty Beauty', 'Rare Beauty', 'Charlotte Tilbury', 'Explore with Moi'], max: 3 },
  { key: 'brands_skin', area: 'skin', q: 'Any favourite skincare brands so far?', options: ['CeraVe', 'The Ordinary', 'La Roche-Posay', 'Glow Recipe', 'Drunk Elephant', 'Explore with Moi'], max: 3 },
  { key: 'brands_hair', area: 'hair', q: 'Any favourite hair brands so far?', options: ['Olaplex', 'Shea Moisture', 'Briogeo', 'Pantene', 'Mielle', 'Explore with Moi'], max: 3 },
  { key: 'brands_fragrance', area: 'fragrance', q: 'Any favourite fragrance brands so far?', options: ['Sol de Janeiro', 'Glossier', 'Dior', 'Le Labo', 'Bath & Body Works', 'Explore with Moi'], max: 3 },
  { key: 'fragrance_when', area: 'fragrance', q: 'When would you wear it?', options: ['Every day', 'Evenings', 'Special occasions', 'Body mist'] },
  { key: 'fragrance_notes', area: 'fragrance', q: 'Which scents do you love?', options: ['Fresh and clean', 'Floral', 'Warm and sweet', 'Woody', 'Musky'], max: 2 },
  { key: 'tools_focus', area: 'tools', q: 'Which kind of tool?', options: ['Hair tools', 'Skin devices', 'Brushes and sponges', 'Nail tools'] },
  { key: 'wellness_focus', area: 'wellness', q: 'What does wellness mean for you right now?', options: ['Better sleep', 'Self-care rituals', 'Winding down', 'Hydration habits'] },
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
  const isArea = (ROUTINE_AREAS as string[]).includes(q.area);
  const areas = !isArea || (s.areas ?? []).includes(q.area as Area) ? s.areas : [...(s.areas ?? []), q.area as Area];
  const prefs = { ...(s.prefs ?? {}) };
  const setPref = (k: string, v: string, max = 1) => {
    const cur = prefs[k] ?? [];
    const solo = v === 'Nothing' || v === 'Explore with Moi';
    prefs[k] = max === 1 || solo ? [v] : cur.includes(v) ? cur : [...cur.filter(x => x !== 'Nothing' && x !== 'Explore with Moi'), v].slice(-max);
  };
  let next: RoutineState = { ...s, areas };
  if (key === 'goals') next.goals = s.goals.includes(value) ? s.goals : [...s.goals, value].slice(-3);
  else if (key.startsWith('hair.')) next.hair = { ...s.hair, [key.slice(5)]: value };
  else setPref(key, value, q.max ?? 1);
  // Habits that decide the routine itself.
  if (key === 'hair_wash') next.washDays = WASH_DAYS[value];
  if (key === 'hair_occasion' && !s.occasions.includes(value)) next.occasions = [...s.occasions, value];
  if (key === 'lip_daily') { const look = ({ Gloss: 'Glossy', 'Liner + gloss': 'Lip contour' } as Record<string, string>)[value]; if (look) prefs.mk_lip_look = [look]; }
  if (key === 'eye_daily' && value === 'Mascara only') prefs.mk_eye_look = ['Barely there'];
  if (key === 'mk_daily' && value === 'None') prefs.mk_face_look = ['Skin first'];
  next = { ...next, prefs };
  return next;
}
