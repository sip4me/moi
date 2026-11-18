import type { ImageSourcePropType } from 'react-native';

/**
 * 3D clay icons (generated in Figma, cut out by scripts/cut-icons.py), keyed by plan lever id.
 * Learn levers share the stethoscope; anything missing falls back to the water drop.
 */
export const ICON3D: Record<string, ImageSourcePropType> = {
  anti_dandruff: require('../../assets/icons3d/anti_dandruff.png'),
  bond_repair: require('../../assets/icons3d/bond_repair.png'),
  calm: require('../../assets/icons3d/calm.png'),
  food_beef: require('../../assets/icons3d/food_beef.png'),
  food_chickpeas: require('../../assets/icons3d/food_chickpeas.png'),
  food_lentils: require('../../assets/icons3d/food_lentils.png'),
  food_oats: require('../../assets/icons3d/food_oats.png'),
  food_orange: require('../../assets/icons3d/food_orange.png'),
  food_pumpkin_seeds: require('../../assets/icons3d/food_pumpkin_seeds.png'),
  food_spinach: require('../../assets/icons3d/food_spinach.png'),
  food_tofu: require('../../assets/icons3d/food_tofu.png'),
  conditioner: require('../../assets/icons3d/conditioner.png'),
  cover_chebe: require('../../assets/icons3d/cover_chebe.png'),
  cover_clarify: require('../../assets/icons3d/cover_clarify.png'),
  cover_heatless: require('../../assets/icons3d/cover_heatless.png'),
  deep_condition: require('../../assets/icons3d/deep_condition.png'),
  detangle: require('../../assets/icons3d/detangle.png'),
  drop: require('../../assets/icons3d/drop.png'),
  dry_shampoo: require('../../assets/icons3d/dry_shampoo.png'),
  ends_oil: require('../../assets/icons3d/ends_oil.png'),
  flax_diet: require('../../assets/icons3d/flax_diet.png'),
  flax_gel: require('../../assets/icons3d/flax_gel.png'),
  gentle_wash: require('../../assets/icons3d/gentle_wash.png'),
  hair_food: require('../../assets/icons3d/hair_food.png'),
  heat_cap: require('../../assets/icons3d/heat_cap.png'),
  heat_protect: require('../../assets/icons3d/heat_protect.png'),
  keto_wash: require('../../assets/icons3d/keto_wash.png'),
  learn: require('../../assets/icons3d/learn.png'),
  leave_in: require('../../assets/icons3d/leave_in.png'),
  loose_styles: require('../../assets/icons3d/loose_styles.png'),
  mirror: require('../../assets/icons3d/mirror.png'),
  pillowcase: require('../../assets/icons3d/pillowcase.png'),
  pre_wash_oil: require('../../assets/icons3d/pre_wash_oil.png'),
  rinse: require('../../assets/icons3d/rinse.png'),
  rosemary: require('../../assets/icons3d/rosemary.png'),
  satin: require('../../assets/icons3d/satin.png'),
  scalp_massage: require('../../assets/icons3d/scalp_massage.png'),
  scalp_scrub: require('../../assets/icons3d/scalp_scrub.png'),
  soft_ties: require('../../assets/icons3d/soft_ties.png'),
  sun_cover: require('../../assets/icons3d/sun_cover.png'),
  swim_prep: require('../../assets/icons3d/swim_prep.png'),
  style_bixie: require('../../assets/icons3d/style_bixie.png'),
  style_blowout: require('../../assets/icons3d/style_blowout.png'),
  style_bob: require('../../assets/icons3d/style_bob.png'),
  style_braids: require('../../assets/icons3d/style_braids.png'),
  style_bun: require('../../assets/icons3d/style_bun.png'),
  style_curls: require('../../assets/icons3d/style_curls.png'),
  style_curtain: require('../../assets/icons3d/style_curtain.png'),
  style_glass: require('../../assets/icons3d/style_glass.png'),
  style_pony: require('../../assets/icons3d/style_pony.png'),
  tea_tree: require('../../assets/icons3d/tea_tree.png'),
  trim: require('../../assets/icons3d/trim.png'),
  wash_interval: require('../../assets/icons3d/wash_interval.png'),
  wind_down: require('../../assets/icons3d/wind_down.png'),
};

/** Levers that reuse another icon. */
const ALIAS: Record<string, string> = { heat_free: 'cover_heatless', night_braid: 'soft_ties', gentle_brush: 'detangle' };

export const icon3d = (id: string): ImageSourcePropType =>
  ICON3D[id] ?? ICON3D[ALIAS[id]] ?? (id.startsWith('learn_') ? ICON3D.learn : ICON3D.drop);
