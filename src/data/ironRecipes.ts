// Iron-maxxing: a breakfast, lunch, snack and dinner each day, chosen to get the most iron
// you can actually absorb. Iron amounts are approximate (USDA FoodData Central), per serving.

export type Slot = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export const SLOT_LABEL: Record<Slot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };

export interface IronRecipe {
  id: string; slot: Slot; name: string; icon: string;
  mg: number; minutes: number; plant: boolean;
  /** What makes the iron count: the vitamin C or heme-iron partner in the dish. */
  boost: string;
  ingredients: string[];
  steps: string[];
}

export const IRON_RECIPES: IronRecipe[] = [
  // Breakfast
  { id: 'oats-berry', slot: 'breakfast', name: 'Fortified oats with strawberries', icon: 'food_oats', mg: 9, minutes: 5, plant: true,
    boost: 'Strawberries add vitamin C, which helps you absorb the cereal’s iron.',
    ingredients: ['1 packet iron-fortified instant oats (check the label for 45%+ daily iron)', '¾ cup milk or soy milk', '½ cup sliced strawberries', '1 tbsp pumpkin seeds'],
    steps: ['Cook the oats with the milk, about 2 minutes.', 'Top with strawberries and pumpkin seeds.', 'Have coffee or tea an hour later, not with it.'] },
  { id: 'spinach-scramble', slot: 'breakfast', name: 'Spinach egg scramble + orange', icon: 'food_spinach', mg: 4, minutes: 8, plant: false,
    boost: 'Eat the orange with it: vitamin C offsets the iron-blocking compounds in eggs and spinach.',
    ingredients: ['2 eggs', '2 big handfuls baby spinach', '1 slice whole-grain toast', '1 orange'],
    steps: ['Wilt the spinach in a pan with a little oil, 1 minute.', 'Add the beaten eggs and stir gently until just set.', 'Serve on toast with the orange on the side.'] },
  { id: 'tofu-toast', slot: 'breakfast', name: 'Tofu scramble on toast', icon: 'food_tofu', mg: 5, minutes: 10, plant: true,
    boost: 'Tomatoes and peppers in the pan bring the vitamin C.',
    ingredients: ['½ block firm tofu (calcium-set)', '½ red pepper, diced', '6 cherry tomatoes, halved', '¼ tsp turmeric', '1 slice whole-grain toast'],
    steps: ['Crumble the tofu into a hot oiled pan.', 'Add pepper, tomatoes and turmeric; cook 5 minutes.', 'Season and pile onto toast.'] },

  // Lunch
  { id: 'lentil-soup', slot: 'lunch', name: 'Lentil and tomato soup', icon: 'food_lentils', mg: 7, minutes: 30, plant: true,
    boost: 'Tomatoes and a squeeze of lemon at the end add vitamin C.',
    ingredients: ['1 cup red lentils, rinsed', '1 can chopped tomatoes', '1 onion, 2 garlic cloves', '1 tsp cumin', '3 cups stock', '½ lemon'],
    steps: ['Soften the onion and garlic in oil, 5 minutes.', 'Add cumin, lentils, tomatoes and stock; simmer 20 minutes.', 'Blend if you like, then squeeze in the lemon. Makes 2–3 servings.'] },
  { id: 'chickpea-salad', slot: 'lunch', name: 'Chickpea, pepper and parsley salad', icon: 'food_chickpeas', mg: 6, minutes: 10, plant: true,
    boost: 'Raw red pepper and lemon are rich in vitamin C, and parsley adds a little more iron.',
    ingredients: ['1 can chickpeas, drained', '1 red pepper, diced', '½ cucumber, diced', 'Big handful parsley, chopped', 'Juice of 1 lemon, 2 tbsp olive oil'],
    steps: ['Toss everything in a bowl.', 'Season with salt and pepper.', 'Keeps 3 days in the fridge — make it once for several lunches.'] },
  { id: 'tofu-bowl', slot: 'lunch', name: 'Crispy tofu and broccoli rice bowl', icon: 'food_tofu', mg: 5, minutes: 20, plant: true,
    boost: 'Broccoli brings vitamin C to unlock the tofu’s iron.',
    ingredients: ['½ block firm tofu, cubed', '1 cup broccoli florets', '¾ cup cooked rice', '1 tbsp soy sauce, 1 tsp sesame oil', '1 tsp sesame seeds'],
    steps: ['Pan-fry the tofu until golden, 8 minutes.', 'Steam or stir-fry the broccoli, 4 minutes.', 'Serve over rice with soy, sesame oil and seeds.'] },

  // Snack
  { id: 'seed-mix', slot: 'snack', name: 'Pumpkin seed and apricot mix', icon: 'food_pumpkin_seeds', mg: 3.5, minutes: 1, plant: true,
    boost: 'Add a clementine for vitamin C.',
    ingredients: ['1 oz pumpkin seeds (a small handful)', '5 dried apricots', '1 clementine'],
    steps: ['Mix and pack for later. That’s it.'] },
  { id: 'hummus-pepper', slot: 'snack', name: 'Hummus with red pepper sticks', icon: 'food_chickpeas', mg: 2.5, minutes: 3, plant: true,
    boost: 'Red pepper is one of the richest vitamin C sources there is.',
    ingredients: ['⅓ cup hummus', '1 red pepper, cut into sticks', 'A few cherry tomatoes'],
    steps: ['Slice and dip.'] },
  { id: 'orange-seeds', slot: 'snack', name: 'Orange with roasted chickpeas', icon: 'food_orange', mg: 2.5, minutes: 2, plant: true,
    boost: 'The orange’s vitamin C helps you absorb the chickpeas’ iron.',
    ingredients: ['1 orange', '⅓ cup roasted chickpeas'],
    steps: ['Peel and enjoy together.'] },

  // Dinner
  { id: 'beef-broccoli', slot: 'dinner', name: 'Beef and broccoli stir-fry', icon: 'food_beef', mg: 4, minutes: 20, plant: false,
    boost: 'Meat iron (heme) absorbs best, and it also helps the plant iron eaten with it.',
    ingredients: ['4 oz lean beef, thinly sliced', '2 cups broccoli florets', '1 tbsp soy sauce, 1 tsp honey, 1 garlic clove', '¾ cup cooked rice'],
    steps: ['Sear the beef in a very hot pan, 2 minutes; set aside.', 'Stir-fry the broccoli with garlic, 4 minutes.', 'Return the beef with soy and honey; toss 1 minute. Serve on rice.'] },
  { id: 'chana-saag', slot: 'dinner', name: 'Spinach and chickpea curry', icon: 'food_spinach', mg: 7, minutes: 25, plant: true,
    boost: 'Tomatoes in the sauce and lemon at the end add vitamin C. Cooking in a cast-iron pan adds a little iron too.',
    ingredients: ['1 can chickpeas, drained', '4 big handfuls spinach', '1 can chopped tomatoes', '1 onion, 2 garlic cloves, thumb of ginger', '1 tbsp curry powder', '½ lemon'],
    steps: ['Soften onion, garlic and ginger, 5 minutes; add curry powder.', 'Add tomatoes and chickpeas; simmer 10 minutes.', 'Stir in the spinach until wilted; finish with lemon. Serves 2.'] },
  { id: 'lentil-bolognese', slot: 'dinner', name: 'Lentil bolognese', icon: 'food_lentils', mg: 6, minutes: 30, plant: true,
    boost: 'The tomato sauce brings vitamin C.',
    ingredients: ['1 cup cooked green or brown lentils', '1 cup tomato passata', '1 carrot, 1 onion, finely chopped', '2 oz whole-wheat pasta', 'Dried oregano'],
    steps: ['Soften carrot and onion, 8 minutes.', 'Add lentils, passata and oregano; simmer 15 minutes.', 'Toss with the cooked pasta.'] },
];

const SLOTS: Slot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
const DAY_MS = 86400000;

/** Today's four picks. Each slot rotates on its own cycle so days rarely repeat. */
export function ironDay(dateKey: string, vegetarian = false) {
  const n = Math.floor(new Date(dateKey + 'T12:00:00Z').getTime() / DAY_MS);
  const meals = SLOTS.map((slot, i) => {
    const options = IRON_RECIPES.filter(r => r.slot === slot && (!vegetarian || r.plant));
    return options[(n + i) % options.length];
  });
  return { meals, mg: Math.round(meals.reduce((t, m) => t + m.mg, 0)) };
}

/** Recommended daily iron (NIH): 18 mg for women 19–50, 27 in pregnancy, 8 for men and after menopause. */
export function ironTarget(answers: Record<string, any>) {
  const lifestyle: string[] = Array.isArray(answers.lifestyle) ? answers.lifestyle : [];
  if (lifestyle.includes('pregnant')) return 27;
  return answers.gender === 'male' ? 8 : 18;
}

/**
 * The daily iron-maxxing goal shown on scans and the iron bar: 22 mg, a little above the 18 mg most
 * women need so absorption losses are covered; 27 mg in pregnancy. Men keep their 8 mg need, since
 * extra iron isn't recommended for them without a doctor.
 */
export function ironGoal(answers: Record<string, any>) {
  const need = ironTarget(answers);
  return need === 8 ? 8 : Math.max(22, need);
}

export const IRON_TIPS = [
  'Pair plant iron with vitamin C in the same meal.',
  'Have tea and coffee an hour away from iron-rich meals.',
  'Don’t take iron pills unless a blood test says you need them — too much is harmful.',
];
