// Onboarding questions that feed the plan engine. Order and wording follow the Figma onboarding.
export type Option = { label: string; sub?: string; value: string | number | boolean };
export type Question = {
  id: string;
  title: string;
  subtitle?: string;
  kind: 'single' | 'multi' | 'tiles';
  options: Option[];
};

export const QUESTIONS: Question[] = [
  { id: 'goal', title: 'What’s your main goal?', subtitle: 'We’ll build your daily plan around it.', kind: 'single', options: [
    { label: 'Less frizz & breakage', sub: 'Smoother, stronger hair', value: 'repair' },
    { label: 'Longer, fuller hair', sub: 'Keep the length you grow', value: 'grow' },
    { label: 'Stop thinning', sub: 'Hold on to density', value: 'keep' },
    { label: 'Calmer scalp', sub: 'Less oil, flakes or itch', value: 'balance' },
  ] },
  { id: 'texture', title: 'Choose your hair texture', subtitle: 'This will be used to calibrate your plan.', kind: 'tiles', options: [
    { label: 'Straight', value: 'straight' }, { label: 'Wavy', value: 'wavy' }, { label: 'Curly', value: 'curly' }, { label: 'Coily', value: 'coily' },
  ] },
  { id: 'length', title: 'How long is your hair?', kind: 'single', options: [
    { label: 'Buzzed', value: 'buzzed' }, { label: 'Short', value: 'short' }, { label: 'Chin', value: 'chin' }, { label: 'Shoulder', value: 'shoulder' },
    { label: 'Mid-back', value: 'mid-back' }, { label: 'Waist or longer', value: 'waist' },
  ] },
  { id: 'washNow', title: 'How often do you wash your hair?', kind: 'single', options: [
    { label: 'Every day', value: 1 }, { label: 'Every 2–3 days', value: 2 }, { label: 'Twice a week', value: 3 }, { label: 'Once a week or less', value: 7 },
  ] },
  { id: 'scalp', title: 'How does your scalp feel?', kind: 'single', options: [
    { label: 'Oily', sub: 'Greasy within a day or two', value: 'oily' }, { label: 'Dry or itchy', value: 'dry' },
    { label: 'Flaky', sub: 'White or yellow flakes', value: 'flaky' }, { label: 'Balanced', value: 'normal' },
  ] },
  { id: 'chemical', title: 'Any treatments?', subtitle: 'In the last 6 months.', kind: 'single', options: [
    { label: 'None', value: 'none' }, { label: 'Color', value: 'color' }, { label: 'Bleach or highlights', value: 'bleach' }, { label: 'Relaxer or straightening', value: 'relaxer' },
  ] },
  { id: 'heatUse', title: 'How often do you use heat?', subtitle: 'Blow-dryer, straightener or curling iron.', kind: 'single', options: [
    { label: 'Never', value: 'none' }, { label: 'A few times a week', value: 'weekly' }, { label: 'Every day', value: 'daily' },
  ] },
  { id: 'tightStyles', title: 'Do you often wear tight styles?', subtitle: 'Ponytails, braids, buns or extensions.', kind: 'single', options: [
    { label: 'Yes, often', value: true }, { label: 'No', value: false },
  ] },
  { id: 'swims', title: 'Do you swim regularly?', kind: 'single', options: [
    { label: 'Yes', sub: 'Pool or ocean, weekly or more', value: true }, { label: 'No', value: false },
  ] },
  { id: 'noticed', title: 'What have you noticed?', subtitle: 'Choose all that apply.', kind: 'multi', options: [
    { label: 'Frizz', value: 'frizz' }, { label: 'Breakage', value: 'breakage' },
    { label: 'Thinning at the part or crown', value: 'pattern_thinning' }, { label: 'Sudden shedding', value: 'sudden_shedding' },
    { label: 'Patchy spots', value: 'patches' }, { label: 'None of these', value: 'none' },
  ] },
  { id: 'porosity', title: 'How does your hair take water?', subtitle: 'Your first scan will measure this.', kind: 'single', options: [
    { label: 'Soaks it up, dries fast', value: 'high' }, { label: 'Somewhere in between', value: 'normal' }, { label: 'Water beads up, dries slowly', value: 'low' },
  ] },
  { id: 'thickness', title: 'How thick is each strand?', kind: 'single', options: [
    { label: 'Fine', sub: 'Hard to feel between fingers', value: 'fine' }, { label: 'Medium', value: 'medium' }, { label: 'Coarse', sub: 'Easy to feel, wiry', value: 'coarse' },
  ] },
  { id: 'prefersNatural', title: 'How do you like to care for your hair?', kind: 'single', options: [
    { label: 'Natural ingredients', value: true }, { label: 'Whatever works best', value: false },
  ] },
  { id: 'timeBudget', title: 'How much time can you give your hair?', subtitle: 'Per day.', kind: 'single', options: [
    { label: '5 min', value: 5 }, { label: '15 min', sub: 'Recommended', value: 15 }, { label: '30 min', value: 30 },
  ] },
];
