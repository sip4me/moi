/** One iron-rich food a day, rotating through the week. Any of them can be swapped for another. */
export type IronFood = { id: string; name: string; serving: string; mg: number; plant: boolean; tip: string };

export const IRON_FOODS: IronFood[] = [
  { id: 'food_lentils', name: 'Lentils', serving: '½ cup cooked', mg: 3.3, plant: true, tip: 'Add to soup, salad or a quick dal.' },
  { id: 'food_spinach', name: 'Spinach', serving: '½ cup cooked', mg: 3.2, plant: true, tip: 'Cooked gives more iron per bite than raw. Squeeze lemon over it.' },
  { id: 'food_beef', name: 'Lean beef', serving: '3 oz', mg: 2.5, plant: false, tip: 'Iron from meat is the easiest to absorb. Swap for chicken thighs or sardines.' },
  { id: 'food_pumpkin_seeds', name: 'Pumpkin seeds', serving: '1 oz handful', mg: 2.5, plant: true, tip: 'A snack, or sprinkled on yogurt and salads.' },
  { id: 'food_chickpeas', name: 'Chickpeas', serving: '½ cup', mg: 2.4, plant: true, tip: 'Hummus counts. Roast them for a crunchy snack.' },
  { id: 'food_tofu', name: 'Tofu', serving: '½ cup', mg: 3.4, plant: true, tip: 'Firm tofu set with calcium is also rich in protein.' },
  { id: 'food_oats', name: 'Fortified cereal or oats', serving: '1 bowl', mg: 8, plant: true, tip: 'Check the label: fortified cereals can give half a day’s iron.' },
];

/** Plant iron absorbs far better with vitamin C in the same meal. */
export const VITAMIN_C = { id: 'food_orange', name: 'Pair with vitamin C', tip: 'An orange, strawberries, peppers or tomatoes in the same meal can multiply how much plant iron you absorb. Tea and coffee with the meal do the opposite — have them an hour apart.' };

const DAY_MS = 86400000;
/** The food for a date, the same for everyone on that day so it's easy to talk about. */
export const ironFoodFor = (dateKey: string) => IRON_FOODS[Math.floor(new Date(dateKey + 'T12:00:00Z').getTime() / DAY_MS) % IRON_FOODS.length];
