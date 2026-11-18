/** "Remind yourself of your glamour": short daily lines, each with a small caps tagline. Original copy. */
export type GlamourCard = { id: string; line: string; tag: string };

export const GLAMOUR: GlamourCard[] = [
  { id: 'g01', line: 'My hair grows in its own time, and I give it the patience I give the people I love.', tag: 'I am worth the wait' },
  { id: 'g02', line: 'I wear my crown on good hair days and every other day too.', tag: 'My crown never comes off' },
  { id: 'g03', line: 'Every gentle choice I make today is a quiet promise to my future self.', tag: 'I keep my promises' },
  { id: 'g04', line: 'My texture is not a problem to fix. It is a signature.', tag: 'I am unmistakably me' },
  { id: 'g05', line: 'I don’t need perfect hair to walk in like I own the room.', tag: 'I am magnetic' },
  { id: 'g06', line: 'Rest is part of my routine, not a break from it.', tag: 'I glow when I rest' },
  { id: 'g07', line: 'I treat my body like the treasure it is — fed, rested and adored.', tag: 'I am a treasure' },
  { id: 'g08', line: 'Shedding a little doesn’t take anything away from who I am.', tag: 'I am whole' },
  { id: 'g09', line: 'I celebrate the small wins: a softer curl, a stronger strand, a calmer scalp.', tag: 'Progress looks good on me' },
  { id: 'g10', line: 'My beauty is not up for debate. It simply is.', tag: 'I am certain of myself' },
  { id: 'g11', line: 'I give myself grace on the days nothing goes to plan.', tag: 'I am gentle with me' },
  { id: 'g12', line: 'Glamour is how I carry myself, not what my hair does today.', tag: 'I carry myself like royalty' },
  { id: 'g13', line: 'I take care of myself because I am worth taking care of.', tag: 'I am worthy' },
  { id: 'g14', line: 'My routine is a ritual of love I get to come back to every day.', tag: 'I show up for myself' },
  { id: 'g15', line: 'I release comparison. My hair has its own story to tell.', tag: 'I write my own story' },
  { id: 'g16', line: 'Calm mind, healthy strands. I breathe and let today be easy.', tag: 'I choose ease' },
  { id: 'g17', line: 'I am allowed to take up space, volume and all.', tag: 'I take up space' },
  { id: 'g18', line: 'The mirror shows a woman becoming more herself every day.', tag: 'I am becoming' },
  { id: 'g19', line: 'I don’t chase perfect. I chase healthy, happy and glowing.', tag: 'I am radiant' },
  { id: 'g20', line: 'My confidence was never stored in my hair — it lives in me.', tag: 'I am my own crown' },
  { id: 'g21', line: 'Every strand I protect today is length I keep tomorrow.', tag: 'I am patient and powerful' },
  { id: 'g22', line: 'I speak kindly to myself, especially in the mirror.', tag: 'I am kind to me' },
  { id: 'g23', line: 'I nourish my body and it answers with strength.', tag: 'I am strong' },
  { id: 'g24', line: 'Today I choose to feel beautiful before anyone tells me I am.', tag: 'I decide my worth' },
  { id: 'g25', line: 'My glow is a habit, and I practice it daily.', tag: 'I practice my glow' },
  { id: 'g26', line: 'Soft hair, soft heart, strong mind.', tag: 'I am balanced' },
  { id: 'g27', line: 'I trust the process — consistency is my quiet superpower.', tag: 'I am consistent' },
  { id: 'g28', line: 'I am the main character in every room I walk into.', tag: 'I own my presence' },
];

const DAY_MS = 86400000;
/** Five cards a day, a different set each day. */
export function todaysGlamour(dateKey: string, count = 5) {
  const day = Math.floor(new Date(dateKey + 'T12:00:00Z').getTime() / DAY_MS);
  const start = (day * count) % GLAMOUR.length;
  return Array.from({ length: count }, (_, i) => GLAMOUR[(start + i) % GLAMOUR.length]);
}
