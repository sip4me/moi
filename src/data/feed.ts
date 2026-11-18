import type { ImageSourcePropType } from 'react-native';

/**
 * Home feed cards (Figma 01b · Home — full scroll). Content is plain-language care ideas,
 * never product recommendations. `locked` cards are teased for the paid plan.
 */
export type FeedCard = {
  id: string;
  title: string;
  bg: string;
  featured?: boolean;              // gold outline in Figma
  image?: ImageSourcePropType;
  tags?: string[];                 // style filters
  locked?: boolean;
  steps?: string[];
  why?: string;
};

export type FeedSection = { id: string; title: string; note?: string; filters?: string[]; cards: FeedCard[] };

const img = {
  beanie: require('../../assets/feed/beanie.png'),
  bonnet: require('../../assets/feed/bonnet.png'),
  braid: require('../../assets/feed/braid.png'),
  scalp: require('../../assets/feed/scalp-reset.png'),
  oil: require('../../assets/feed/moisture-oil.png'),
  comb: require('../../assets/feed/comb.png'),
  rice: require('../../assets/feed/rice-water.png'),
  clay: require('../../assets/feed/rhassoul.png'),
  amla: require('../../assets/feed/amla.png'),
  tape: require('../../assets/feed/tape.png'),
  rollers: require('../../assets/icons3d/cover_heatless.png'),
  clarify: require('../../assets/icons3d/cover_clarify.png'),
  chebe: require('../../assets/icons3d/cover_chebe.png'),
};

const season = () => ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Fall', 'Fall', 'Fall', 'Winter'][new Date().getMonth()];

export function feed(): FeedSection[] {
  const now = season();
  return [
    {
      id: 'styles', title: 'Styles to try', note: now, filters: [now, 'For you', 'Protective', 'No heat'],
      cards: [
        { id: 'beanie', title: 'Silk-lined beanie', bg: '#DCE6F7', featured: true, image: img.beanie, tags: ['Winter', 'Fall', 'For you', 'No heat'],
          why: 'Wool rubs and pulls moisture from the hair shaft. A smooth lining cuts the friction that causes frizz and breakage.',
          steps: ['Pick a hat lined with silk or satin, or sew a satin band inside one you own.', 'Put it on over dry hair. Damp hair under a hat stays damp and frizzes.', 'Take it off gently from the back instead of dragging it forward.'] },
        { id: 'bonnet', title: 'Satin bonnet nights', bg: '#F3DCE6', featured: true, image: img.bonnet, tags: ['Winter', 'Summer', 'Spring', 'Fall', 'For you', 'Protective', 'No heat'],
          why: 'Cotton pillowcases grab hair as you turn over. A satin bonnet or pillowcase lets hair glide, so less breaks overnight.',
          steps: ['Loosely gather long hair on top of your head (a "pineapple") or in a loose braid.', 'Slide the bonnet on so the elastic sits on your forehead, not on your hairline.', 'Wash the bonnet weekly with your laundry.'] },
        { id: 'braid', title: 'Braided crown', bg: '#F3EEE1', image: img.braid, tags: ['Winter', 'Summer', 'Protective', 'No heat'],
          why: 'Tucking your ends away protects the oldest, most fragile part of the hair from rubbing on collars and scarves.',
          steps: ['Start with detangled, slightly damp hair and a little leave-in.', 'Make two loose braids and pin them across the top of your head.', 'Keep it loose at the hairline. If it feels tight, it is too tight.'] },
        { id: 'heatless', title: 'Heatless curls', bg: '#EFE7F7', image: img.rollers, locked: true, tags: ['For you', 'No heat'] },
      ],
    },
    {
      id: 'care', title: 'Everyday care routines', note: 'Any texture',
      cards: [
        { id: 'scalp-reset', title: 'Scalp reset Sunday', bg: '#E5F0EC', featured: true, image: img.scalp,
          why: 'Buildup from products, oil and dead skin can make roots look flat and itchy. A weekly reset clears it without stripping.',
          steps: ['Before washing, massage your scalp with your fingertips for 2–3 minutes.', 'Shampoo the scalp only, twice. The rinse cleans the lengths.', 'Condition the mid-lengths and ends, never the roots.'] },
        { id: 'moisture-lock', title: 'Overnight moisture lock', bg: '#F3E3C3', featured: true, image: img.oil,
          why: 'Light oil on the ends slows how fast water leaves the hair, which helps dry, high-porosity ends.',
          steps: ['On dry hair, warm 2–3 drops of a light oil between your palms.', 'Smooth it over the bottom third of your hair only.', 'Sleep in a bonnet or on satin and wash as usual.'] },
        { id: 'detangle', title: 'Gentle detangle', bg: '#F6E3DC', image: img.comb,
          why: 'Most breakage happens while detangling. Starting at the ends means each knot is worked out once instead of pulled tighter.',
          steps: ['Detangle with conditioner in, using a wide-tooth comb.', 'Start at the ends and work up a few inches at a time.', 'Hold the hair above the knot so the pull is not on your scalp.'] },
        { id: 'clarify', title: 'Monthly clarify', bg: '#EFE7F7', image: img.clarify, locked: true },
      ],
    },
    {
      id: 'rituals', title: 'Global hair rituals',
      cards: [
        { id: 'rice', title: 'Rice water rinse · East Asia', bg: '#EEF3FD', featured: true, image: img.rice,
          why: 'A traditional rinse. People like how it adds slip and shine. The research is early, and protein-sensitive hair can feel stiff afterward.',
          steps: ['Rinse ½ cup of rice, then soak it in 2 cups of water for 30 minutes and strain.', 'After shampoo, pour it over your hair and leave it for 5 minutes.', 'Rinse well with plain water. Use it once a week at most.'] },
        { id: 'clay', title: 'Rhassoul clay · Morocco', bg: '#F6E3DC', featured: true, image: img.clay,
          why: 'A mineral clay used as a gentle cleanser. It lifts oil without lather and suits oily scalps.',
          steps: ['Mix 2 tablespoons of clay with warm water into a yogurt-like paste.', 'Work it into a wet scalp and leave it for 5–10 minutes. Don’t let it dry.', 'Rinse thoroughly, then condition your ends.'] },
        { id: 'amla', title: 'Amla oil · India', bg: '#E5F0EC', image: img.amla,
          why: 'Indian gooseberry steeped in oil, used as a pre-wash treatment. It softens hair; claims about growth aren’t proven.',
          steps: ['Warm a teaspoon of amla oil between your palms.', 'Apply to the lengths 30 minutes before washing.', 'Shampoo as usual. Patch-test first if your scalp is sensitive.'] },
        { id: 'chebe', title: 'Chébé ritual · Chad', bg: '#F6E3DC', image: img.chebe, locked: true },
      ],
    },
  ];
}

export type RecordCard = { id: string; value: string; label: string; bg: string; dark?: boolean; featured?: boolean; image?: ImageSourcePropType; source?: string };

export const records = (streakWeeks: number): RecordCard[] => [
  { id: 'longest', value: '5.63 m', label: 'Longest hair ever', bg: '#FDF0D9', featured: true, image: img.tape, source: 'Guinness World Records, Xie Qiuping, 2004' },
  { id: 'afro', value: '190 cm', label: 'Largest afro (female)', bg: '#F3DCE6', source: 'Guinness World Records, Jessica Martinez, 2025 (circumference)' },
  { id: 'streak', value: `${streakWeeks} wk`, label: 'Your scan streak', bg: '#0A0A0A', dark: true, featured: true },
];
