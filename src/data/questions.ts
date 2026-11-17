// Onboarding questions that render on the shared question screen (src/app/onboarding/q/[id].tsx).
// Wording follows the Figma onboarding. Screens with custom layouts (pickers, sliders, info pages)
// live in src/app/onboarding/ and are ordered together with these in src/data/flow.ts.

export type Option = { label: string; sub?: string; value: string | number | boolean; group?: string };
export type Question = {
  id: string;
  title: string;
  subtitle?: string;
  /** rows: full-width option rows · tiles: 2×2 picture tiles · chips: wrapped pills, optionally grouped */
  kind: 'single' | 'multi' | 'tiles' | 'chips';
  options: Option[];
  /** chips only: placeholder for a free-text "something else" field */
  writeIn?: string;
};

const CALIBRATE = 'This will be used to calibrate your custom plan.';

export const QUESTIONS: Question[] = [
  { id: 'gender', title: 'Choose your gender', subtitle: CALIBRATE, kind: 'single', options: [
    { label: 'Female', value: 'female' }, { label: 'Male', value: 'male' }, { label: 'Other', value: 'other' },
  ] },
  { id: 'washNow', title: 'How often do you wash your hair?', subtitle: CALIBRATE, kind: 'single', options: [
    { label: 'Every day', value: 1 }, { label: 'Every 2–3 days', value: 2 }, { label: 'Twice a week', value: 3 },
    { label: 'Once a week', value: 7 }, { label: 'Every 2–3 weeks', value: 14 }, { label: 'Less often than that', value: 21 },
  ] },
  { id: 'hearAbout', title: 'Where did you hear about us?', kind: 'single', options: [
    { label: 'App Store', value: 'app_store' }, { label: 'TikTok', value: 'tiktok' }, { label: 'YouTube', value: 'youtube' },
    { label: 'TV', value: 'tv' }, { label: 'X', value: 'x' }, { label: 'Instagram', value: 'instagram' }, { label: 'Google', value: 'google' },
    { label: 'Facebook', value: 'facebook' }, { label: 'Friend or family', value: 'friend' }, { label: 'Other', value: 'other' },
  ] },
  { id: 'triedApps', title: 'Have you tried other hair care apps?', kind: 'single', options: [
    { label: 'No', value: false }, { label: 'Yes', value: true },
  ] },
  { id: 'texture', title: 'Choose your hair texture', subtitle: CALIBRATE, kind: 'tiles', options: [
    { label: 'Straight', value: 'straight' }, { label: 'Wavy', value: 'wavy' }, { label: 'Curly', value: 'curly' }, { label: 'Coily', value: 'coily' },
  ] },
  { id: 'scalp', title: 'How does your scalp feel?', subtitle: 'By the second day after washing.', kind: 'single', options: [
    { label: 'Oily', sub: 'Greasy within a day or two', value: 'oily' }, { label: 'Dry or itchy', value: 'dry' },
    { label: 'Flaky', sub: 'White or yellow flakes', value: 'flaky' }, { label: 'Balanced', value: 'normal' },
  ] },
  { id: 'chemical', title: 'Have you treated your hair?', subtitle: 'In the last 6 months.', kind: 'single', options: [
    { label: 'None', value: 'none' }, { label: 'Color', value: 'color' }, { label: 'Bleach or highlights', value: 'bleach' }, { label: 'Relaxer, perm or keratin', value: 'relaxer' },
  ] },
  { id: 'heatUse', title: 'How often do you use heat?', subtitle: 'Blow-dryer, straightener or curling iron.', kind: 'single', options: [
    { label: 'Never', value: 'none' }, { label: 'A few times a week', value: 'weekly' }, { label: 'Every day', value: 'daily' },
  ] },
  { id: 'hairstyles', title: 'What hairstyles do you wear?', subtitle: 'Select all that apply. Styling affects breakage and scalp health.', kind: 'chips', writeIn: 'Something else? Type your style…', options: [
    { label: 'Heat styled', value: 'heat_styled' }, { label: 'Natural', value: 'natural' }, { label: 'Braids', value: 'braids' },
    { label: 'Gel / slick back', value: 'slick_back' }, { label: 'Fade', value: 'fade' }, { label: 'Locs / dreadlocks', value: 'locs' },
    { label: 'Twists', value: 'twists' }, { label: 'Ponytail / bun', value: 'ponytail' }, { label: 'Wigs / weaves', value: 'wigs' },
  ] },
  { id: 'lifestyle', title: 'What kind of active lifestyle do you have?', subtitle: 'Choose all that apply.', kind: 'multi', options: [
    { label: 'Sports', sub: 'Swimming, running, boxing or regular gym', value: 'sports' },
    { label: 'Demanding job', value: 'demanding_job' },
    { label: 'Student', value: 'student' },
    { label: 'Pregnant', value: 'pregnant' },
    { label: 'Caring for a child', value: 'caregiver' },
    { label: 'None of these', value: 'none' },
  ] },
  { id: 'noticed', title: 'What have you noticed?', subtitle: 'Select all that apply.', kind: 'chips', options: [
    { group: 'GROWTH & COVERAGE', label: 'More shedding', value: 'sudden_shedding' },
    { group: 'GROWTH & COVERAGE', label: 'Receding hairline', value: 'receding' },
    { group: 'GROWTH & COVERAGE', label: 'Thinning crown', value: 'thinning_crown' },
    { group: 'GROWTH & COVERAGE', label: 'Wider part', value: 'wider_part' },
    { group: 'GROWTH & COVERAGE', label: 'Patchy spots', value: 'patches' },
    { group: 'STRANDS', label: 'Frizz', value: 'frizz' }, { group: 'STRANDS', label: 'Dryness', value: 'dryness' },
    { group: 'STRANDS', label: 'Breakage', value: 'breakage' }, { group: 'STRANDS', label: 'Split ends', value: 'split_ends' },
    { group: 'STRANDS', label: 'Dullness', value: 'dullness' },
    { group: 'SCALP', label: 'Flakes', value: 'flakes' }, { group: 'SCALP', label: 'Oily roots', value: 'oily_roots' },
    { group: 'SCALP', label: 'Itch', value: 'itch' }, { group: 'SCALP', label: 'Buildup', value: 'buildup' },
  ] },
  { id: 'goal', title: 'What are your hair goals?', subtitle: 'Choose all that apply. We’ll lead with the first one you pick.', kind: 'multi', options: [
    { label: 'Less frizz & breakage', sub: 'Smoother, stronger hair', value: 'repair' },
    { label: 'Longer, fuller hair', sub: 'Keep the length you grow', value: 'grow' },
    { label: 'Stop thinning', sub: 'Hold on to density', value: 'keep' },
    { label: 'Calmer scalp', sub: 'Less oil, flakes or itch', value: 'balance' },
  ] },
  { id: 'porosity', title: 'How does your hair take water?', subtitle: 'Your first scan will measure this.', kind: 'single', options: [
    { label: 'Soaks it up, dries fast', value: 'high' }, { label: 'Somewhere in between', value: 'normal' }, { label: 'Water beads up, dries slowly', value: 'low' },
  ] },
  { id: 'stopping', title: 'What’s stopping you from reaching your goals?', subtitle: 'Select all that apply.', kind: 'multi', options: [
    { label: 'Too many products', value: 'too_many_products' }, { label: 'Mixed advice', value: 'mixed_advice' },
    { label: 'Can’t see progress', value: 'no_progress' }, { label: 'Staying consistent', value: 'consistency' }, { label: 'Cost', value: 'cost' },
  ] },
  { id: 'prefersNatural', title: 'How do you like to care for your hair?', kind: 'single', options: [
    { label: 'Natural ingredients', value: true }, { label: 'Whatever works best', value: false },
  ] },
  { id: 'accomplish', title: 'What would you like to accomplish?', subtitle: 'Select all that apply.', kind: 'multi', options: [
    { label: 'Boost hair growth', value: 'growth' }, { label: 'Feel more confident', value: 'confidence' },
    { label: 'Spend less time styling', value: 'less_time' }, { label: 'Stop wasting money on products', value: 'save_money' },
    { label: 'Look good in photos', value: 'photos' },
  ] },
];

export const questionById = (id: string) => QUESTIONS.find(q => q.id === id);
